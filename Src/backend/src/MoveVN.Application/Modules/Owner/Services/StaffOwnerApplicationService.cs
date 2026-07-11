using System.Text.Json;
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

public class StaffOwnerApplicationService : IStaffOwnerApplicationService
{
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IAuthActivityLogger _activityLogger;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _unitOfWork;

    public StaffOwnerApplicationService(
        ICurrentUserContext currentUserContext,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ICloudinaryService cloudinaryService,
        IAuthActivityLogger activityLogger,
        INotificationService notificationService,
        IUnitOfWork unitOfWork)
    {
        _currentUserContext = currentUserContext;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _cloudinaryService = cloudinaryService;
        _activityLogger = activityLogger;
        _notificationService = notificationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<StaffOwnerApplicationListItem>> GetApplicationsAsync(
        string? status, string? keyword, DateTime? fromDate, DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var items = await _userRepository.GetOwnerApplicationsByFilterAsync(status, keyword, fromDate, toDate, cancellationToken);

        return items.Select(x => new StaffOwnerApplicationListItem
        {
            Id = x.Id,
            UserId = x.UserId,
            UserFullName = x.UserFullName,
            UserEmail = x.UserEmail,
            UserPhone = x.UserPhone,
            Status = x.Status,
            NationalIdVerified = x.NationalIdVerified,
            BankInfoCompleted = !string.IsNullOrWhiteSpace(x.BankName)
                && !string.IsNullOrWhiteSpace(x.BankAccountNumber),
            CreatedAt = x.CreatedAt,
            SubmittedAt = x.SubmittedAt
        }).ToList();
    }

    public async Task<StaffOwnerApplicationDetailResponse> GetApplicationDetailAsync(
        long id, CancellationToken cancellationToken = default)
    {
        var application = await _userRepository.GetOwnerApplicationByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.STAFF_APPLICATION_NOT_FOUND);

        var user = await _userRepository.GetByIdAsync(application.UserId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(application.UserId, cancellationToken);

        var response = new StaffOwnerApplicationDetailResponse
        {
            Id = application.Id,
            Status = application.Status,
            User = new StaffUserInfo
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                Status = user.Status,
                IsEmailVerified = user.IsEmailVerified,
                CreatedAt = user.CreatedAt
            },
            CustomerProfile = new StaffCustomerProfileInfo
            {
                NationalId = customerProfile?.NationalId,
                NationalIdMasked = customerProfile?.NationalIdMasked,
                NationalIdVerified = customerProfile?.NationalIdVerified ?? false,
                DateOfBirth = customerProfile?.DateOfBirth,
                Address = customerProfile?.Address
            },
            BankInfo = new StaffBankInfo
            {
                BankName = application.BankName,
                BankAccountNumber = application.BankAccountNumber,
                BankAccountHolderName = application.BankAccountHolderName
            },
            CreatedAt = application.CreatedAt,
            SubmittedAt = application.SubmittedAt,
            ApprovedAt = application.ApprovedAt,
            ApprovedBy = application.ApprovedBy,
            RejectedAt = application.RejectedAt,
            RejectedBy = application.RejectedBy,
            RejectionReason = application.RejectionReason
        };

        if (application.NationalIdVerificationRequestId.HasValue)
        {
            var verification = await _userRepository.GetVerificationRequestByIdAsync(
                application.NationalIdVerificationRequestId.Value, cancellationToken);

            if (verification is not null)
            {
                var frontUrl = !string.IsNullOrWhiteSpace(verification.FrontImagePublicId)
                    ? await _cloudinaryService.GetSignedUrlAsync(verification.FrontImagePublicId, 60)
                    : null;
                var backUrl = !string.IsNullOrWhiteSpace(verification.BackImagePublicId)
                    ? await _cloudinaryService.GetSignedUrlAsync(verification.BackImagePublicId, 60)
                    : null;

                response.VerificationRequest = new StaffVerificationInfo
                {
                    Id = verification.Id,
                    Type = verification.Type,
                    Status = verification.Status,
                    FrontImageSignedUrl = frontUrl,
                    BackImageSignedUrl = backUrl,
                    Confidence = verification.Confidence,
                    DecisionReason = verification.DecisionReason,
                    CreatedAt = verification.CreatedAt,
                    ProcessedAt = verification.ProcessedAt
                };
            }
        }

        return response;
    }

    public async Task ApproveApplicationAsync(long id, CancellationToken cancellationToken = default)
    {
        var staffId = GetCurrentUserId();

        var application = await _userRepository.GetOwnerApplicationByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.STAFF_APPLICATION_NOT_FOUND);

        if (application.Status is not ("ReadyToSubmit" or "ManualReview"))
        {
            throw new AppException(ErrorCode.STAFF_APPROVE_INVALID_STATE);
        }

        var user = await _userRepository.GetByIdAsync(application.UserId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(application.UserId, cancellationToken);

        if (customerProfile is null || !customerProfile.NationalIdVerified)
        {
            throw new AppException(ErrorCode.OWNER_CCCD_NOT_VERIFIED);
        }

        if (string.IsNullOrWhiteSpace(application.BankName)
            || string.IsNullOrWhiteSpace(application.BankAccountNumber))
        {
            throw new AppException(ErrorCode.OWNER_BANK_INFO_MISSING);
        }

        var roles = await _roleRepository.GetUserRoleNamesAsync(application.UserId, cancellationToken);
        if (!roles.Contains(UserRoleType.Owner.ToString(), StringComparer.OrdinalIgnoreCase))
        {
            var ownerRole = await _roleRepository.GetByNameAsync(UserRoleType.Owner, cancellationToken)
                ?? throw new AppException(ErrorCode.INVALID_ROLE);

            await _roleRepository.AddUserRoleAsync(new UserRole
            {
                UserId = application.UserId,
                RoleId = ownerRole.Id,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = staffId
            }, cancellationToken);
        }

        application.Status = "Approved";
        application.ApprovedAt = DateTime.UtcNow;
        application.ApprovedBy = staffId;
        application.UpdatedAt = DateTime.UtcNow;
        _userRepository.UpdateOwnerApplication(application);

        var existingOwnerProfile = await _userRepository.GetOwnerProfileByUserIdAsync(application.UserId, cancellationToken);
        if (existingOwnerProfile is null)
        {
            existingOwnerProfile = new OwnerProfile
            {
                UserId = application.UserId,
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
        await _activityLogger.LogAsync(application.UserId, user.Email, AuthEventType.OwnerApplicationApproved, null, null, cancellationToken: cancellationToken);
        await _activityLogger.LogAsync(application.UserId, user.Email, AuthEventType.OwnerRoleAssigned, null, null, cancellationToken: cancellationToken);
        await NotifyOwnerApplicationAsync(
            application,
            "Ho so chu xe da duoc duyet",
            "Ho so chu xe cua ban da duoc nhan vien duyet. Vui long lam moi dang nhap neu chua thay vai tro moi.",
            "/become-owner",
            "OwnerApplicationApproved",
            cancellationToken);
    }

    public async Task RejectApplicationAsync(long id, string reason, CancellationToken cancellationToken = default)
    {
        var staffId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);
        }

        var application = await _userRepository.GetOwnerApplicationByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.STAFF_APPLICATION_NOT_FOUND);

        if (application.Status is "Approved" or "Rejected")
        {
            throw new AppException(ErrorCode.STAFF_REJECT_INVALID_STATE);
        }

        application.Status = "Rejected";
        application.RejectedAt = DateTime.UtcNow;
        application.RejectedBy = staffId;
        application.RejectionReason = reason;
        application.UpdatedAt = DateTime.UtcNow;
        _userRepository.UpdateOwnerApplication(application);

        var user = await _userRepository.GetByIdAsync(application.UserId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(application.UserId, user?.Email, AuthEventType.OwnerApplicationRejected, null, null, cancellationToken: cancellationToken);
        await NotifyOwnerApplicationAsync(
            application,
            "Ho so chu xe bi tu choi",
            $"Ho so chu xe cua ban bi tu choi. Ly do: {reason.Trim()}",
            "/become-owner",
            "OwnerApplicationRejected",
            cancellationToken);
    }

    public async Task RequestMoreInfoAsync(long id, string reason, CancellationToken cancellationToken = default)
    {
        var staffId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);
        }

        var application = await _userRepository.GetOwnerApplicationByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.STAFF_APPLICATION_NOT_FOUND);

        if (application.Status is "Approved" or "Rejected")
        {
            throw new AppException(ErrorCode.STAFF_REQUEST_MORE_INFO_INVALID_STATE);
        }

        application.Status = "NeedMoreInfo";
        application.RejectionReason = reason;
        application.UpdatedAt = DateTime.UtcNow;
        _userRepository.UpdateOwnerApplication(application);

        var user = await _userRepository.GetByIdAsync(application.UserId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _activityLogger.LogAsync(application.UserId, user?.Email, AuthEventType.OwnerApplicationMoreInfoRequested, null, null, cancellationToken: cancellationToken);
        await NotifyOwnerApplicationAsync(
            application,
            "Ho so chu xe can bo sung",
            $"Ho so chu xe cua ban can bo sung thong tin. Ly do: {reason.Trim()}",
            "/become-owner",
            "OwnerApplicationNeedMoreInfo",
            cancellationToken);
    }

    private async Task NotifyOwnerApplicationAsync(
        OwnerApplication application,
        string title,
        string body,
        string targetPath,
        string action,
        CancellationToken cancellationToken)
    {
        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = application.UserId,
            Type = "OwnerApplication",
            Title = title,
            Body = body,
            DataJson = JsonSerializer.Serialize(new
            {
                ownerApplicationId = application.Id,
                status = application.Status,
                targetPath,
                action
            }),
            Channel = "InApp"
        }, cancellationToken);
    }

    private long GetCurrentUserId()
    {
        return _currentUserContext.UserId
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }
}
