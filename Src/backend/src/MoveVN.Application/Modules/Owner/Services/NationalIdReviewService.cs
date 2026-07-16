using System.Text.Json;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Owner.Services;

public class NationalIdReviewService : INationalIdReviewService
{
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _unitOfWork;

    public NationalIdReviewService(
        ICurrentUserContext currentUserContext,
        IUserRepository userRepository,
        INotificationService notificationService,
        IUnitOfWork unitOfWork)
    {
        _currentUserContext = currentUserContext;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<NationalIdVerificationListItem>> GetListAsync(
        string? status, string? keyword, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _userRepository.GetNationalIdVerificationsPagedAsync(status, keyword, page, pageSize, cancellationToken);
        return new PagedResult<NationalIdVerificationListItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<NationalIdVerificationDetailDto> GetDetailAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _userRepository.GetNationalIdVerificationDetailAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.OWNER_NATIONAL_ID_VERIFICATION_NOT_FOUND);
    }

    public async Task ApproveAsync(long id, CancellationToken cancellationToken = default)
    {
        var reviewerId = GetCurrentUserId();
        var request = await _userRepository.GetVerificationRequestByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.OWNER_NATIONAL_ID_VERIFICATION_NOT_FOUND);
        if (request.Type != "NationalId" || request.Status != "Pending")
        {
            throw new AppException(ErrorCode.OWNER_NATIONAL_ID_REVIEW_INVALID_STATE);
        }

        var customerProfile = await _userRepository.GetCustomerProfileByUserIdAsync(request.UserId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        request.Status = "Verified";
        request.ReviewedBy = reviewerId;
        request.ReviewedAt = DateTime.UtcNow;
        request.DecisionReason = "Nhân viên đã duyệt xác thực CCCD.";
        _userRepository.UpdateVerificationRequest(request);

        customerProfile.NationalIdVerified = true;
        _userRepository.UpdateCustomerProfile(customerProfile);

        var application = await _userRepository.GetLatestOwnerApplicationByUserIdAsync(request.UserId, cancellationToken);
        if (application is not null)
        {
            if (application.NationalIdVerificationRequestId is null)
            {
                application.NationalIdVerificationRequestId = request.Id;
            }
            application.Status = DetermineApplicationStatus(application);
            application.UpdatedAt = DateTime.UtcNow;
            _userRepository.UpdateOwnerApplication(application);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await NotifyUserAsync(request.UserId, request.Id, "Verified", "CCCD cua ban da duoc nhan vien xac thuc thanh cong.", cancellationToken);
    }

    public async Task RejectAsync(long id, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);
        }

        var reviewerId = GetCurrentUserId();
        var request = await _userRepository.GetVerificationRequestByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.OWNER_NATIONAL_ID_VERIFICATION_NOT_FOUND);
        if (request.Type != "NationalId" || request.Status != "Pending")
        {
            throw new AppException(ErrorCode.OWNER_NATIONAL_ID_REVIEW_INVALID_STATE);
        }

        request.Status = "Rejected";
        request.ReviewedBy = reviewerId;
        request.ReviewedAt = DateTime.UtcNow;
        request.RejectionReason = reason.Trim();
        request.DecisionReason = reason.Trim();
        _userRepository.UpdateVerificationRequest(request);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await NotifyUserAsync(request.UserId, request.Id, "Rejected", reason.Trim(), cancellationToken);
    }

    public async Task RequestMoreInfoAsync(long id, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new AppException(ErrorCode.STAFF_REASON_REQUIRED);
        }

        var reviewerId = GetCurrentUserId();
        var request = await _userRepository.GetVerificationRequestByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.OWNER_NATIONAL_ID_VERIFICATION_NOT_FOUND);
        if (request.Type != "NationalId" || request.Status != "Pending")
        {
            throw new AppException(ErrorCode.OWNER_NATIONAL_ID_REVIEW_INVALID_STATE);
        }

        request.Status = "NeedMoreInfo";
        request.ReviewedBy = reviewerId;
        request.ReviewedAt = DateTime.UtcNow;
        request.RejectionReason = reason.Trim();
        request.DecisionReason = reason.Trim();
        _userRepository.UpdateVerificationRequest(request);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await NotifyUserAsync(request.UserId, request.Id, "NeedMoreInfo", reason.Trim(), cancellationToken);
    }

    private async Task NotifyUserAsync(long userId, long requestId, string status, string message, CancellationToken cancellationToken)
    {
        var (title, fallbackBody, action) = status switch
        {
            "Verified" => ("CCCD da duoc xac thuc", "CCCD cua ban da duoc nhan vien xac thuc thanh cong.", "NationalIdVerified"),
            "Rejected" => ("CCCD khong dat yeu cau", "CCCD cua ban chua dat yeu cau xac minh.", "NationalIdRejected"),
            "NeedMoreInfo" => ("CCCD can bo sung", "Vui long chup lai anh CCCD ro hon de tiep tuc xac minh.", "NationalIdNeedMoreInfo"),
            _ => ("Cap nhat xac thuc CCCD", "Trang thai xac thuc CCCD cua ban da duoc cap nhat.", "NationalIdUpdated")
        };

        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = userId,
            Type = "OwnerVerification",
            Title = title,
            Body = string.IsNullOrWhiteSpace(message) ? fallbackBody : message.Trim(),
            DataJson = JsonSerializer.Serialize(new
            {
                verificationRequestId = requestId,
                documentType = "NationalId",
                status,
                targetPath = "/account/verification/cccd",
                action
            }),
            Channel = "InApp"
        }, cancellationToken);
    }

    private static string DetermineApplicationStatus(OwnerApplication application)
    {
        bool bankInfoCompleted = !string.IsNullOrWhiteSpace(application.BankName)
            && !string.IsNullOrWhiteSpace(application.BankAccountNumber)
            && !string.IsNullOrWhiteSpace(application.BankAccountHolderName);
        return bankInfoCompleted ? "ReadyToSubmit" : "WaitingBankInfo";
    }

    private long GetCurrentUserId()
    {
        return _currentUserContext.UserId
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }
}
