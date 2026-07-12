using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Owner.Services;

public class OwnerApplicationService : IOwnerApplicationService
{
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IRedisLockService _redisLockService;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IAuthActivityLogger _activityLogger;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly IOtpService _otpService;
    private readonly INotificationService _notificationService;
    private readonly INationalIdVerificationClient _nationalIdVerificationClient;
    private readonly ILogger<OwnerApplicationService> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public OwnerApplicationService(
        ICurrentUserContext currentUserContext,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IRedisLockService redisLockService,
        ICloudinaryService cloudinaryService,
        IAuthActivityLogger activityLogger,
        IPasswordHasherService passwordHasherService,
        IOtpService otpService,
        INotificationService notificationService,
        INationalIdVerificationClient nationalIdVerificationClient,
        ILogger<OwnerApplicationService> logger,
        IUnitOfWork unitOfWork)
    {
        _currentUserContext = currentUserContext;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _redisLockService = redisLockService;
        _cloudinaryService = cloudinaryService;
        _activityLogger = activityLogger;
        _passwordHasherService = passwordHasherService;
        _otpService = otpService;
        _notificationService = notificationService;
        _nationalIdVerificationClient = nationalIdVerificationClient;
        _logger = logger;
        _unitOfWork = unitOfWork;
    }

    public async Task<CreateOwnerApplicationResponse> CreateApplicationAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        EnsureUserCanBecomeOwner(user);

        var roles = await _roleRepository.GetUserRoleNamesAsync(userId, cancellationToken);
        if (roles.Contains(UserRoleType.Owner.ToString(), StringComparer.OrdinalIgnoreCase))
        {
            throw new AppException(ErrorCode.OWNER_ALREADY_OWNER);
        }

        if (await _userRepository.HasActiveOwnerApplicationAsync(userId, cancellationToken))
        {
            throw new AppException(ErrorCode.OWNER_APPLICATION_ACTIVE);
        }

        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken);

        string status;
        string nextStep;

        if (customerProfile is not null && customerProfile.NationalIdVerified)
        {
            status = "WaitingBankInfo";
            nextStep = "BankInfo";
        }
        else
        {
            status = "WaitingCccdVerification";
            nextStep = "UploadNationalId";
        }

        var application = new OwnerApplication
        {
            UserId = userId,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddOwnerApplicationAsync(application, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(userId, user.Email, AuthEventType.OwnerApplicationCreated, null, null, cancellationToken: cancellationToken);

        return new CreateOwnerApplicationResponse
        {
            Id = application.Id,
            Status = application.Status,
            NextStep = nextStep
        };
    }

    public async Task<OwnerApplicationResponse> GetCurrentApplicationAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();

        var data = await _userRepository.GetOwnerApplicationCurrentDataAsync(userId, cancellationToken);

        var bankInfoCompleted = data is not null
            && !string.IsNullOrWhiteSpace(data.BankName)
            && !string.IsNullOrWhiteSpace(data.BankAccountNumber);

        return new OwnerApplicationResponse
        {
            Id = data?.Id ?? 0,
            Status = data?.Status ?? "None",
            NationalIdVerified = data?.CustomerNationalIdVerified ?? false,
            BankInfoCompleted = bankInfoCompleted,
            IsOwner = data?.IsOwner ?? false,
            NextStep = DetermineNextStep(data, data?.CustomerNationalIdVerified ?? false, bankInfoCompleted, data?.IsOwner ?? false),
            FullName = data?.UserFullName,
            NationalIdNumber = data?.CustomerNationalId,
            BankName = data?.BankName,
            BankAccountNumber = data?.BankAccountNumber,
            BankAccountHolderName = data?.BankAccountHolderName,
            RejectReason = data?.RejectionReason,
            Email = data?.Email,
            EmailVerified = data?.IsEmailVerified ?? false,
            DriverLicenseVerified = data?.DriverLicenseVerified ?? false,
            CreatedAt = data?.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task<OwnerApplicationResponse> UpdateBankInfoAsync(UpdateBankInfoRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();

        var application = await _userRepository.GetLatestOwnerApplicationByUserIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.OWNER_APPLICATION_NOT_FOUND);

        application.BankName = request.BankName.Trim();
        application.BankAccountNumber = request.BankAccountNumber.Trim();
        application.BankAccountHolderName = request.BankAccountHolderName.Trim();
        application.UpdatedAt = DateTime.UtcNow;

        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken);

        if (customerProfile is not null && customerProfile.NationalIdVerified)
        {
            application.Status = "ReadyToSubmit";
        }
        else
        {
            application.Status = "WaitingCccdVerification";
        }

        _userRepository.UpdateOwnerApplication(application);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        await _activityLogger.LogAsync(userId, user?.Email, AuthEventType.OwnerApplicationBankUpdated, null, null, cancellationToken: cancellationToken);

        var bankInfoCompleted = !string.IsNullOrWhiteSpace(application.BankName)
            && !string.IsNullOrWhiteSpace(application.BankAccountNumber);

        return new OwnerApplicationResponse
        {
            Id = application.Id,
            Status = application.Status,
            NationalIdVerified = customerProfile?.NationalIdVerified ?? false,
            BankInfoCompleted = bankInfoCompleted,
            IsOwner = false,
            NextStep = DetermineNextStep(application, customerProfile?.NationalIdVerified ?? false, bankInfoCompleted, false),
            Email = user?.Email,
            EmailVerified = user?.IsEmailVerified ?? false,
            DriverLicenseVerified = customerProfile?.DriverLicenseVerified ?? false
        };
    }

    public async Task<SubmitOwnerApplicationResponse> SubmitApplicationAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();

        var application = await _userRepository.GetLatestOwnerApplicationByUserIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.OWNER_APPLICATION_NOT_FOUND);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        var roles = await _roleRepository.GetUserRoleNamesAsync(userId, cancellationToken);
        if (roles.Contains(UserRoleType.Owner.ToString(), StringComparer.OrdinalIgnoreCase))
        {
            throw new AppException(ErrorCode.OWNER_ALREADY_OWNER);
        }

        if (user.Status != UserStatus.Active.ToString())
        {
            throw new AppException(ErrorCode.OWNER_USER_NOT_ACTIVE);
        }

        if (!user.IsEmailVerified)
        {
            throw new AppException(ErrorCode.OWNER_EMAIL_NOT_VERIFIED);
        }

        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken);
        if (customerProfile is null || !customerProfile.NationalIdVerified)
        {
            throw new AppException(ErrorCode.OWNER_CCCD_NOT_VERIFIED);
        }

        if (string.IsNullOrWhiteSpace(application.BankName)
            || string.IsNullOrWhiteSpace(application.BankAccountNumber)
            || string.IsNullOrWhiteSpace(application.BankAccountHolderName))
        {
            throw new AppException(ErrorCode.OWNER_BANK_INFO_MISSING);
        }

        if (application.Status != "ReadyToSubmit")
        {
            throw new AppException(ErrorCode.OWNER_NOT_READY_TO_SUBMIT);
        }

        var @lock = await _redisLockService.AcquireLockAsync(
            $"owner_application:submit_lock:{userId}",
            TimeSpan.FromMinutes(5),
            cancellationToken);

        if (@lock is null)
        {
            throw new AppException(ErrorCode.REDIS_LOCK_FAILED);
        }

        try
        {
            var ownerRole = await _roleRepository.GetByNameAsync(UserRoleType.Owner, cancellationToken)
                ?? throw new AppException(ErrorCode.INVALID_ROLE);

            application.Status = "Approved";
            application.SubmittedAt = DateTime.UtcNow;
            application.ApprovedAt = DateTime.UtcNow;
            application.UpdatedAt = DateTime.UtcNow;
            _userRepository.UpdateOwnerApplication(application);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var existingOwnerProfile = await _userRepository.GetOwnerProfileByUserIdAsync(userId, cancellationToken);
            if (existingOwnerProfile is null)
            {
                existingOwnerProfile = new OwnerProfile
                {
                    UserId = userId,
                    BankName = application.BankName,
                    BankAccountNumber = application.BankAccountNumber,
                    BankAccountHolderName = application.BankAccountHolderName,
                    IsVerified = true,
                    VerifiedAt = DateTime.UtcNow
                };
                await _userRepository.AddOwnerProfileAsync(existingOwnerProfile, cancellationToken);
            }
            else
            {
                existingOwnerProfile.BankName = application.BankName;
                existingOwnerProfile.BankAccountNumber = application.BankAccountNumber;
                existingOwnerProfile.BankAccountHolderName = application.BankAccountHolderName;
                existingOwnerProfile.IsVerified = true;
                existingOwnerProfile.VerifiedAt = DateTime.UtcNow;
                _userRepository.UpdateOwnerProfile(existingOwnerProfile);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _roleRepository.AddUserRoleAsync(new UserRole
            {
                UserId = userId,
                RoleId = ownerRole.Id,
                AssignedAt = DateTime.UtcNow
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _activityLogger.LogAsync(userId, user.Email, AuthEventType.OwnerApplicationSubmitted, null, null, cancellationToken: cancellationToken);
            await _activityLogger.LogAsync(userId, user.Email, AuthEventType.OwnerRoleAssigned, null, null, cancellationToken: cancellationToken);
            await NotifyOwnerApplicationAsync(
                userId,
                application,
                "Ho so chu xe da duoc duyet",
                "Ban da tro thanh chu xe tren MoveVN. Vui long lam moi dang nhap neu chua thay vai tro moi.",
                "/become-owner",
                "OwnerApplicationApproved",
                cancellationToken);
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(@lock, cancellationToken);
        }

        return new SubmitOwnerApplicationResponse
        {
            Status = "Approved",
            IsOwner = true,
            RequiresTokenRefresh = true,
            NextStep = "OwnerDashboard"
        };
    }

    public async Task<OwnerOnboardingRegisterResponse> RegisterOwnerOnboardingAsync(
        OwnerOnboardingRegisterRequest request, CancellationToken cancellationToken = default)
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

        var role = await _roleRepository.GetByNameAsync(UserRoleType.Customer, cancellationToken)
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

        await _userRepository.AddCustomerProfileAsync(new CustomerProfile { UserId = user.Id }, cancellationToken);

        var application = new OwnerApplication
        {
            UserId = user.Id,
            Status = "WaitingEmailVerification",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddOwnerApplicationAsync(application, cancellationToken);

        await _otpService.CreateOtpAsync(user.Email, OtpPurpose.Register, user.Id, null, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.RegisterRequested, null, null, cancellationToken: cancellationToken);
        await _activityLogger.LogAsync(user.Id, user.Email, AuthEventType.OwnerApplicationCreated, null, null, cancellationToken: cancellationToken);

        return new OwnerOnboardingRegisterResponse
        {
            UserId = user.Id,
            OwnerApplicationId = application.Id,
            NextStep = "VerifyEmail"
        };
    }

    public async Task<NationalIdUploadResponse> UploadNationalIdAsync(
        Stream frontImage, string frontFileName,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();

        var application = await _userRepository.GetLatestOwnerApplicationByUserIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.OWNER_APPLICATION_NOT_FOUND);

        if (application.Status is "Approved" or "Rejected" or "Cancelled")
        {
            throw new AppException(ErrorCode.OWNER_APPLICATION_NOT_FOUND);
        }

        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        if (customerProfile.NationalIdVerified)
        {
            throw new AppException(ErrorCode.OWNER_NATIONAL_ID_ALREADY_VERIFIED);
        }

        var existingRequest = await _userRepository.GetLatestNationalIdVerificationByUserIdAsync(userId, cancellationToken);
        if (existingRequest is not null && existingRequest.Status is "Pending" or "Processing")
        {
            existingRequest.Status = "Failed";
            existingRequest.DecisionReason = "Cancelled due to a new upload request.";
            _userRepository.UpdateVerificationRequest(existingRequest);
        }

        var verificationRequest = new VerificationRequest
        {
            UserId = userId,
            Type = "NationalId",
            Status = "Processing",
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddVerificationRequestAsync(verificationRequest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        try
        {
            using var frontMem = new MemoryStream();
            await frontImage.CopyToAsync(frontMem, cancellationToken);

            var frontBytes = frontMem.ToArray();

            var preVerifyResult = await _nationalIdVerificationClient.PreVerifyAsync(frontBytes, frontFileName, cancellationToken);

            if (preVerifyResult is null || !preVerifyResult.Success)
            {
                verificationRequest.Status = "Rejected";
                verificationRequest.DecisionReason = "Hình ảnh không hợp lệ hoặc quá mờ. Vui lòng kiểm tra lại ảnh chụp của bạn.\nKhuyến khích sử dụng ảnh chụp từ ứng dụng VNeID để có chất lượng tốt nhất.";
                verificationRequest.ProcessedAt = DateTime.UtcNow;
                _userRepository.UpdateVerificationRequest(verificationRequest);

                application.UpdatedAt = DateTime.UtcNow;
                _userRepository.UpdateOwnerApplication(application);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                return new NationalIdUploadResponse
                {
                    Status = "Rejected",
                    NationalIdVerified = false,
                    OwnerApplicationStatus = application.Status,
                    NextStep = "UploadNationalId",
                    Message = verificationRequest.DecisionReason
                };
            }

            var folder = $"movevn/private/identity/{userId}/{verificationRequest.Id}";

            using var frontForCloud = new MemoryStream(frontBytes);
            var frontUpload = await _cloudinaryService.UploadAsync(frontForCloud, frontFileName, $"{folder}/front", cancellationToken);

            verificationRequest.FrontImagePublicId = frontUpload.PublicId;
            verificationRequest.FrontImageUrl = frontUpload.Url;
            verificationRequest.Status = "Verified";
            verificationRequest.ExternalProvider = "AI_VERIFICATION";
            verificationRequest.ExternalResultJson = preVerifyResult.RawResponse;
            verificationRequest.Confidence = (decimal)preVerifyResult.Confidence;
            verificationRequest.ProcessedAt = DateTime.UtcNow;
            verificationRequest.DecisionReason = "AI pre-verification passed.";

            customerProfile.NationalId = preVerifyResult.NationalId;
            customerProfile.NationalIdHash = HashNationalId(preVerifyResult.NationalId);
            customerProfile.NationalIdMasked = MaskNationalId(preVerifyResult.NationalId);
            if (preVerifyResult.DateOfBirth.HasValue)
                customerProfile.DateOfBirth = DateOnly.FromDateTime(preVerifyResult.DateOfBirth.Value);
            customerProfile.Address = preVerifyResult.Address;
            customerProfile.NationalIdVerified = true;
            _userRepository.UpdateCustomerProfile(customerProfile);

            bool bankInfoCompleted = !string.IsNullOrWhiteSpace(application.BankName)
                && !string.IsNullOrWhiteSpace(application.BankAccountNumber);

            application.Status = bankInfoCompleted ? "ReadyToSubmit" : "WaitingBankInfo";
            application.NationalIdVerificationRequestId = verificationRequest.Id;
            application.UpdatedAt = DateTime.UtcNow;
            _userRepository.UpdateOwnerApplication(application);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            await _activityLogger.LogAsync(userId, user?.Email, AuthEventType.NationalIdVerified, null, null, cancellationToken: cancellationToken);

            return new NationalIdUploadResponse
            {
                Status = "Verified",
                NationalIdVerified = true,
                OwnerApplicationStatus = application.Status,
                NextStep = bankInfoCompleted ? "ReviewSubmit" : "BankInfo"
            };
        }
        catch (AppException)
        {
            verificationRequest.Status = "Failed";
            verificationRequest.ExternalResultJson ??= "{}";
            _userRepository.UpdateVerificationRequest(verificationRequest);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UploadNationalIdAsync failed for user {UserId}. Error: {Message}", userId, ex.Message);
            verificationRequest.Status = "Failed";
            verificationRequest.ExternalResultJson ??= "{}";
            _userRepository.UpdateVerificationRequest(verificationRequest);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw new AppException(ErrorCode.OWNER_VERIFICATION_REQUEST_FAILED, [ex.Message]);
        }
    }

    private static string HashNationalId(string? nationalId)
    {
        if (string.IsNullOrWhiteSpace(nationalId))
        {
            return string.Empty;
        }

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(nationalId));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string MaskNationalId(string? nationalId)
    {
        if (string.IsNullOrWhiteSpace(nationalId))
        {
            return string.Empty;
        }

        if (nationalId.Length <= 4)
        {
            return new string('*', nationalId.Length);
        }

        return new string('*', nationalId.Length - 4) + nationalId[^4..];
    }

    private long GetCurrentUserId()
    {
        return _currentUserContext.UserId
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    private void EnsureUserCanBecomeOwner(User user)
    {
        if (!user.IsEmailVerified)
        {
            throw new AppException(ErrorCode.OWNER_EMAIL_NOT_VERIFIED);
        }

        if (user.Status == UserStatus.Suspended.ToString())
        {
            throw new AppException(ErrorCode.OWNER_USER_NOT_ACTIVE);
        }

        if (user.Status != UserStatus.Active.ToString())
        {
            user.Status = UserStatus.Active.ToString();
            user.UpdatedAt = DateTime.UtcNow;
            _userRepository.Update(user);
        }
    }

    private static string DetermineNextStep(OwnerApplicationCurrentData? data, bool nationalIdVerified, bool bankInfoCompleted, bool isOwner)
    {
        if (isOwner) return "OwnerDashboard";
        if (data is null) return "BecomeOwner";
        return DetermineNextStep(data.Status);
    }

    private static string DetermineNextStep(OwnerApplication? application, bool nationalIdVerified, bool bankInfoCompleted, bool isOwner)
    {
        if (isOwner) return "OwnerDashboard";
        if (application is null) return "BecomeOwner";
        return DetermineNextStep(application.Status);
    }

    private static string DetermineNextStep(string status)
    {
        return status switch
        {
            "WaitingCccdVerification" => "UploadNationalId",
            "WaitingBankInfo" => "BankInfo",
            "ReadyToSubmit" => "ReviewSubmit",
            "Approved" => "OwnerDashboard",
            "ManualReview" => "ManualReview",
            "NeedMoreInfo" => "NeedMoreInfo",
            "Rejected" => "Rejected",
            _ => "BecomeOwner"
        };
    }

    private async Task NotifyOwnerApplicationAsync(
        long userId,
        OwnerApplication application,
        string title,
        string body,
        string targetPath,
        string action,
        CancellationToken cancellationToken)
    {
        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = userId,
            Type = "OwnerApplication",
            Title = title,
            Body = body,
            DataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                ownerApplicationId = application.Id,
                status = application.Status,
                targetPath,
                action
            }),
            Channel = "InApp"
        }, cancellationToken);
    }
}
