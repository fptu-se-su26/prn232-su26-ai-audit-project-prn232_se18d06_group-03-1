using System.Net.Http.Json;
using AutoMapper;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IOtpService _otpService;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ITokenSessionService _tokenSessionService;
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IAuthActivityLogger _activityLogger;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AuthService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IRefreshTokenService refreshTokenService,
        IOtpService otpService,
        IPasswordHasherService passwordHasherService,
        IJwtTokenService jwtTokenService,
        ITokenSessionService tokenSessionService,
        ICurrentUserContext currentUserContext,
        IAuthActivityLogger activityLogger,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _refreshTokenService = refreshTokenService;
        _otpService = otpService;
        _passwordHasherService = passwordHasherService;
        _jwtTokenService = jwtTokenService;
        _tokenSessionService = tokenSessionService;
        _currentUserContext = currentUserContext;
        _activityLogger = activityLogger;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Password != request.ConfirmPassword)
        {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (await _userRepository.ExistsByEmailAsync(request.Email, cancellationToken))
        {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (await _userRepository.ExistsByPhoneAsync(request.Phone, cancellationToken))
        {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        if (!Enum.TryParse<UserRoleType>(request.Role, true, out var roleType)
            || roleType is UserRoleType.Admin or UserRoleType.Staff)
        {
            throw new AppException(ErrorCode.INVALID_ROLE);
        }

        var role = await _roleRepository.GetByNameAsync(roleType, cancellationToken)
            ?? throw new AppException(ErrorCode.INVALID_ROLE);

        var user = new User
        {
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            PasswordHash = _passwordHasherService.Hash(request.Password),
            Status = UserStatus.Pending.ToString(),
            IsEmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _roleRepository.AddUserRoleAsync(new UserRole
        {
            UserId = user.Id,
            RoleId = role.Id,
            AssignedAt = DateTime.UtcNow
        }, cancellationToken);

        if (roleType == UserRoleType.Customer)
        {
            await _userRepository.AddCustomerProfileAsync(new CustomerProfile { UserId = user.Id }, cancellationToken);
        }
        else if (roleType == UserRoleType.Owner)
        {
            await _userRepository.AddOwnerProfileAsync(new OwnerProfile { UserId = user.Id }, cancellationToken);
        }

        await _otpService.CreateOtpAsync(user.Email, OtpPurpose.Register, user.Id, null, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.RegisterRequested, null, null, cancellationToken: cancellationToken);

        var userResponse = _mapper.Map<AuthUserResponse>(user);
        userResponse.Roles = [roleType.ToString()];

        return new AuthResponse
        {
            User = userResponse
        };
    }

    public async Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default)
    {
        var purpose = ParseOtpPurpose(request.Purpose);
        await _otpService.VerifyOtpAsync(request.Email, request.Otp, purpose, cancellationToken);

        if (purpose is OtpPurpose.Register or OtpPurpose.VerifyEmail)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken)
                ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

            user.IsEmailVerified = true;
            user.Status = UserStatus.Active.ToString();
            user.UpdatedAt = DateTime.UtcNow;
            _userRepository.Update(user);
            await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.OtpVerified, null, null, cancellationToken: cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        await _otpService.CreateOtpAsync(user.Email, ParseOtpPurpose(request.Purpose), user.Id, null, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest request, CancellationToken cancellationToken = default)
    {
        GoogleUserInfo googleUser;
        try
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            googleUser = await httpClient.GetFromJsonAsync<GoogleUserInfo>(
                $"https://www.googleapis.com/oauth2/v3/userinfo?access_token={request.IdToken}",
                cancellationToken) ?? throw new AppException(ErrorCode.GOOGLE_AUTH_FAILED);

            if (string.IsNullOrWhiteSpace(googleUser.Email))
            {
                throw new AppException(ErrorCode.GOOGLE_AUTH_FAILED);
            }
        }
        catch
        {
            throw new AppException(ErrorCode.GOOGLE_AUTH_FAILED);
        }

        var email = googleUser.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(email, cancellationToken);

        if (user is null)
        {
            var role = await _roleRepository.GetByNameAsync(UserRoleType.Customer, cancellationToken)
                ?? throw new AppException(ErrorCode.INVALID_ROLE);

            user = new User
            {
                Email = email,
                FullName = googleUser.Name ?? email,
                AvatarUrl = googleUser.Picture,
                ExternalId = googleUser.Sub,
                AuthProvider = "Google",
                Status = UserStatus.Active.ToString(),
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _roleRepository.AddUserRoleAsync(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id,
                AssignedAt = DateTime.UtcNow
            }, cancellationToken);

            await _userRepository.AddCustomerProfileAsync(new CustomerProfile { UserId = user.Id }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else
        {
            if (user.Status == UserStatus.Suspended.ToString())
            {
                throw new AppException(ErrorCode.USER_SUSPENDED);
            }

            user.ExternalId ??= googleUser.Sub;
            user.AuthProvider ??= "Google";
            user.AvatarUrl ??= googleUser.Picture;
        }

        user.LastLoginAt = DateTime.UtcNow;
        user.LastSeenAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var sessionId = Guid.NewGuid().ToString("N");
        var response = await CreateAuthResponseAsync(user, sessionId, request.UserAgent, request.IpAddress, cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.GoogleLogin, request.IpAddress, request.UserAgent, sessionId, cancellationToken: cancellationToken);
        return response;
    }

    private record GoogleUserInfo
    {
        public string Sub { get; init; } = string.Empty;
        public string? Name { get; init; }
        public string? Email { get; init; }
        public string? Picture { get; init; }
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (user is null || user.PasswordHash is null || !_passwordHasherService.Verify(user.PasswordHash, request.Password))
        {
            await _activityLogger.LogAsync(null, request.Email, AuthEventType.LoginFailed, request.IpAddress, request.UserAgent, cancellationToken: cancellationToken);
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        EnsureCanLogin(user);

        user.LastLoginAt = DateTime.UtcNow;
        user.LastSeenAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var sessionId = Guid.NewGuid().ToString("N");
        var response = await CreateAuthResponseAsync(user, sessionId, request.UserAgent, request.IpAddress, cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.LoginSucceeded, request.IpAddress, request.UserAgent, sessionId, cancellationToken: cancellationToken);
        return response;
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var oldToken = await _refreshTokenService.ValidateAsync(request.RefreshToken, cancellationToken);
        var user = await _userRepository.GetByIdAsync(oldToken.UserId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        EnsureCanLogin(user);
        oldToken.RevokedAt = DateTime.UtcNow;

        var sessionId = string.IsNullOrWhiteSpace(oldToken.SessionId)
            ? Guid.NewGuid().ToString("N")
            : oldToken.SessionId;
        return await CreateAuthResponseAsync(
            user,
            sessionId,
            oldToken.DeviceInfo ?? request.UserAgent,
            oldToken.IpAddress ?? request.IpAddress,
            cancellationToken);
    }

    public async Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default)
    {
        await _refreshTokenService.RevokeAsync(request.RefreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        await _otpService.CreateOtpAsync(user.Email, OtpPurpose.ForgotPassword, user.Id, null, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.PasswordResetRequested, null, null, cancellationToken: cancellationToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (request.NewPassword != request.ConfirmPassword)
        {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        await _otpService.VerifyOtpAsync(user.Email, request.Otp, OtpPurpose.ForgotPassword, cancellationToken);
        user.PasswordHash = _passwordHasherService.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.PasswordResetCompleted, null, null, cancellationToken: cancellationToken);
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (_currentUserContext.UserId is not { } userId)
        {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        if (user.PasswordHash is null || !_passwordHasherService.Verify(user.PasswordHash, request.CurrentPassword))
        {
            throw new AppException(ErrorCode.PASSWORD_INCORRECT);
        }

        user.PasswordHash = _passwordHasherService.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.PasswordChanged, null, null, cancellationToken: cancellationToken);
    }

    public async Task AdminResetPasswordAsync(AdminResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (request.NewPassword != request.ConfirmPassword)
        {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        user.PasswordHash = _passwordHasherService.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.PasswordForceReset, null, null, cancellationToken: cancellationToken);
    }

    public async Task<AuthUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (_currentUserContext.UserId is not { } userId)
        {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        return await MapUserAsync(user, cancellationToken);
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(
        User user,
        string sessionId,
        string? userAgent,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        var roles = await _roleRepository.GetUserRoleNamesAsync(user.Id, cancellationToken);
        var refreshToken = await _refreshTokenService.CreateAsync(user.Id, userAgent, sessionId, ipAddress, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userResponse = _mapper.Map<AuthUserResponse>(user);
        userResponse.Roles = roles;

        var token = _jwtTokenService.GenerateToken(user.Id, user.Email, roles, refreshToken.PlainToken, refreshToken.Entity.ExpiresAt);
        token.SessionId = sessionId;
        refreshToken.Entity.AccessTokenJti = token.AccessTokenJti;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _tokenSessionService.StoreAsync(userResponse, token, cancellationToken);

        return new AuthResponse
        {
            Token = token,
            User = userResponse
        };
    }

    private async Task<AuthUserResponse> MapUserAsync(User user, CancellationToken cancellationToken)
    {
        var response = _mapper.Map<AuthUserResponse>(user);
        response.Roles = await _roleRepository.GetUserRoleNamesAsync(user.Id, cancellationToken);
        return response;
    }

    private static void EnsureCanLogin(User user)
    {
        if (user.Status == UserStatus.Suspended.ToString())
        {
            throw new AppException(ErrorCode.USER_SUSPENDED);
        }

        if (!user.IsEmailVerified)
        {
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
    }

    private static OtpPurpose ParseOtpPurpose(string purpose)
    {
        return Enum.TryParse<OtpPurpose>(purpose, true, out var parsed)
            ? parsed
            : throw new AppException(ErrorCode.OTP_FAIL);
    }
}
