using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using System.Security.Cryptography;
using System.Text;

namespace MoveVN.Application.Modules.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IIdentityService _identityService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IAuthLogService _authLogService;
    private readonly IRateLimitService _rateLimitService;
    private readonly IEmailService _emailService;
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        IIdentityService identityService,
        IJwtTokenService jwtTokenService,
        ICurrentUserContext currentUserContext,
        IAuthLogService authLogService,
        IRateLimitService rateLimitService,
        IEmailService emailService,
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IHttpContextAccessor httpContextAccessor)
    {
        _identityService = identityService;
        _jwtTokenService = jwtTokenService;
        _currentUserContext = currentUserContext;
        _authLogService = authLogService;
        _rateLimitService = rateLimitService;
        _emailService = emailService;
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        // Check duplicate email in domain Users table
        var existingDomainUser = await _userRepository.FindByEmailAsync(request.Email, cancellationToken);
        if (existingDomainUser is not null)
            throw new ValidationException(new[] { "Email đã được đăng ký." });

        // Check Identity table
        var existingIdentity = await _identityService.FindByEmailAsync(request.Email, cancellationToken);
        if (existingIdentity is not null)
            throw new ValidationException(new[] { "Email đã được đăng ký." });

        // Create ASP.NET Identity user (for future SSO compatibility)
        var identityUser = await _identityService.CreateUserAsync(request, cancellationToken);

        // Create domain User
        var domainUser = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Phone = request.Phone,
            Status = "Pending",
            IsEmailVerified = false
        };
        await _userRepository.AddAsync(domainUser, cancellationToken);
        await _userRepository.SaveChangesAsync(cancellationToken);

        // Seed Customer role (RoleId=2)
        await _userRepository.AssignRoleAsync(domainUser.Id, 2, cancellationToken);

        // Generate verify token and send email
        var verifyToken = await _jwtTokenService.GenerateEmailVerifyTokenAsync(domainUser.Id, domainUser.Email);
        var verifyUrl = BuildVerifyUrl(verifyToken);
        _ = Task.Run(() => _emailService.SendEmailVerificationAsync(domainUser.Email, domainUser.FullName, verifyUrl));

        // Log
        _ = Task.Run(() => _authLogService.LogAsync(domainUser.Id, domainUser.Email, "Register", true,
            GetIp(), GetUserAgent()));

        return await BuildAuthResponseAsync(domainUser, cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var ip = GetIp();
        var ua = GetUserAgent();

        // Brute-force protection
        if (await _rateLimitService.IsLoginLockedAsync(request.Email, cancellationToken))
        {
            _ = Task.Run(() => _authLogService.LogAsync(null, request.Email, "LoginFailed", false, ip, ua, "Account locked due to too many failed attempts"));
            throw new ValidationException(new[] { "Tài khoản tạm khóa do đăng nhập sai quá nhiều lần. Thử lại sau 15 phút." });
        }

        var user = await _userRepository.FindByEmailAsync(request.Email, cancellationToken);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            await _rateLimitService.RecordLoginFailAsync(request.Email, cancellationToken);
            _ = Task.Run(() => _authLogService.LogAsync(user?.Id, request.Email, "LoginFailed", false, ip, ua, "Invalid credentials"));
            throw new ValidationException(new[] { "Email hoặc mật khẩu không đúng." });
        }

        if (user.Status == "Banned")
        {
            _ = Task.Run(() => _authLogService.LogAsync(user.Id, user.Email, "LoginFailed", false, ip, ua, "Account banned"));
            throw new ValidationException(new[] { "Tài khoản đã bị khóa vĩnh viễn." });
        }

        await _rateLimitService.ResetLoginAttemptsAsync(request.Email, cancellationToken);

        user.LastLoginAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _authLogService.LogAsync(user.Id, user.Email, "Login", true, ip, ua));

        return await BuildAuthResponseAsync(user, cancellationToken);
    }

    public async Task<AuthUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        var domainUserId = _currentUserContext.DomainUserId
            ?? throw new ValidationException(new[] { "Không tìm thấy thông tin người dùng." });

        var user = await _userRepository.GetByIdAsync(domainUserId, cancellationToken)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        var roles = await _userRepository.GetRolesAsync(user.Id, cancellationToken);

        return new AuthUserResponse
        {
            UserId = Guid.Empty,
            DomainUserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Roles = roles,
            IsEmailVerified = user.IsEmailVerified
        };
    }

    public async Task VerifyEmailAsync(string token, CancellationToken cancellationToken = default)
    {
        var payload = _jwtTokenService.ValidateEmailVerifyToken(token)
            ?? throw new ValidationException(new[] { "Token xác thực không hợp lệ hoặc đã hết hạn." });

        var user = await _userRepository.GetByIdAsync(payload.UserId, cancellationToken)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        if (user.IsEmailVerified)
            return; // idempotent

        user.IsEmailVerified = true;
        user.Status = "Active";
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var tokenHash = HashToken(request.RefreshToken);
        var storedToken = await _refreshTokenRepository.FindByHashAsync(tokenHash, cancellationToken)
            ?? throw new ValidationException(new[] { "Refresh token không hợp lệ." });

        if (storedToken.RevokedAt.HasValue)
            throw new ValidationException(new[] { "Refresh token đã bị thu hồi." });

        if (storedToken.ExpiresAt < DateTime.UtcNow)
            throw new ValidationException(new[] { "Refresh token đã hết hạn." });

        // Token rotation: revoke old token
        storedToken.RevokedAt = DateTime.UtcNow;
        _refreshTokenRepository.Update(storedToken);

        var user = await _userRepository.GetByIdAsync(storedToken.UserId, cancellationToken)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        var response = await BuildAuthResponseAsync(user, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _authLogService.LogAsync(user.Id, user.Email, "TokenRefreshed", true, GetIp(), GetUserAgent()));

        return response;
    }

    public async Task LogoutAsync(CancellationToken cancellationToken = default)
    {
        var domainUserId = _currentUserContext.DomainUserId;
        if (domainUserId is null) return;

        var user = await _userRepository.GetByIdAsync(domainUserId.Value, cancellationToken);
        _ = Task.Run(() => _authLogService.LogAsync(domainUserId, user?.Email, "Logout", true, GetIp(), GetUserAgent()));
    }

    public async Task RevokeAllSessionsAsync(CancellationToken cancellationToken = default)
    {
        var domainUserId = _currentUserContext.DomainUserId
            ?? throw new ValidationException(new[] { "Không tìm thấy thông tin người dùng." });

        await _refreshTokenRepository.RevokeAllByUserAsync(domainUserId, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<AuthResponse> BuildAuthResponseAsync(User user, CancellationToken cancellationToken)
    {
        var roles = await _userRepository.GetRolesAsync(user.Id, cancellationToken);

        var accessToken = await _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.Email, roles);
        var rawRefreshToken = _jwtTokenService.GenerateRefreshToken();

        // Save refresh token (7 days)
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeviceInfo = GetUserAgent()
        };
        await _refreshTokenRepository.AddAsync(refreshTokenEntity, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            AccessTokenExpiry = DateTime.UtcNow.AddMinutes(15),
            User = new AuthUserResponse
            {
                UserId = Guid.Empty,
                DomainUserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Roles = roles,
                IsEmailVerified = user.IsEmailVerified
            }
        };
    }

    private static string HashToken(string token)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    private string GetIp() =>
        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private string GetUserAgent() =>
        _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString() ?? "unknown";

    private string BuildVerifyUrl(string token)
    {
        var request = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = request is null ? "https://localhost" : $"{request.Scheme}://{request.Host}";
        return $"{baseUrl}/api/auth/verify-email?token={Uri.EscapeDataString(token)}";
    }
}
