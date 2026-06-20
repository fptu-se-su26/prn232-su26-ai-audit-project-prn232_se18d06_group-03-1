using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
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
    private readonly IAuthActivityLogger _activityLogger;
    private readonly IUnitOfWork _unitOfWork;

    public OwnerApplicationService(
        ICurrentUserContext currentUserContext,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IRedisLockService redisLockService,
        IAuthActivityLogger activityLogger,
        IUnitOfWork unitOfWork)
    {
        _currentUserContext = currentUserContext;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _redisLockService = redisLockService;
        _activityLogger = activityLogger;
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

        var application = await _userRepository.GetLatestOwnerApplicationByUserIdAsync(userId, cancellationToken);
        var roles = await _roleRepository.GetUserRoleNamesAsync(userId, cancellationToken);
        var isOwner = roles.Contains(UserRoleType.Owner.ToString(), StringComparer.OrdinalIgnoreCase);
        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(userId, cancellationToken);

        var nationalIdVerified = customerProfile?.NationalIdVerified ?? false;
        var bankInfoCompleted = application is not null
            && !string.IsNullOrWhiteSpace(application.BankName)
            && !string.IsNullOrWhiteSpace(application.BankAccountNumber);

        return new OwnerApplicationResponse
        {
            Id = application?.Id ?? 0,
            Status = application?.Status ?? "None",
            NationalIdVerified = nationalIdVerified,
            BankInfoCompleted = bankInfoCompleted,
            IsOwner = isOwner,
            NextStep = DetermineNextStep(application, nationalIdVerified, bankInfoCompleted, isOwner)
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
            NextStep = DetermineNextStep(application, customerProfile?.NationalIdVerified ?? false, bankInfoCompleted, false)
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

    private long GetCurrentUserId()
    {
        return _currentUserContext.UserId
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    private static void EnsureUserCanBecomeOwner(User user)
    {
        if (user.Status != UserStatus.Active.ToString())
        {
            throw new AppException(ErrorCode.OWNER_USER_NOT_ACTIVE);
        }

        if (!user.IsEmailVerified)
        {
            throw new AppException(ErrorCode.OWNER_EMAIL_NOT_VERIFIED);
        }
    }

    private static string DetermineNextStep(OwnerApplication? application, bool nationalIdVerified, bool bankInfoCompleted, bool isOwner)
    {
        if (isOwner)
        {
            return "OwnerDashboard";
        }

        if (application is null)
        {
            return "BecomeOwner";
        }

        return application.Status switch
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
}
