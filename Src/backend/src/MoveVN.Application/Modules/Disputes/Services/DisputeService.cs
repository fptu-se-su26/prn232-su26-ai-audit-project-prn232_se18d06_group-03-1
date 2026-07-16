using System.Text.Json;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Disputes.DTOs;
using MoveVN.Application.Modules.Disputes.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Disputes.Services;

public class DisputeService : IDisputeService
{
    private const int MaxPageSize = 50;
    private static readonly string[] Statuses = ["Open", "Investigating", "NeedMoreEvidence", "Escalated", "DecisionIssued", "AwaitingExternalSettlement", "Resolved"];
    private static readonly string[] ReportTypes = ["Dispute", "Damage", "Payment", "NoShow"];
    private static readonly string[] CompensationDirections = ["CustomerPaysOwner", "OwnerRefundsCustomer", "NoCompensation"];
    private static readonly string[] SettlementMethods = ["ExternalOnly", "DepositThenExternal"];
    private static readonly string[] EvidenceTargets = ["Customer", "Owner", "Both"];

    private readonly IDisputeRepository _repository;
    private readonly INotificationService _notificationService;
    private readonly IWalletRepository _walletRepository;

    public DisputeService(IDisputeRepository repository, INotificationService notificationService, IWalletRepository walletRepository)
    {
        _repository = repository;
        _notificationService = notificationService;
        _walletRepository = walletRepository;
    }

    public async Task<DisputeDetailResponse> CreateAsync(CreateDisputeRequest request, long userId, string actorRole, CancellationToken cancellationToken = default)
    {
        var booking = await _repository.GetBookingByIdAsync(request.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.CustomerId != userId && booking.OwnerId != userId)
        {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (await _repository.HasOpenDisputeForBookingAsync(booking.Id, cancellationToken))
        {
            throw new ValidationException(["Booking already has an active dispute."]);
        }

        var now = DateTime.UtcNow;
        var reportType = Normalize(request.ReportType, ReportTypes, "Dispute");
        if (reportType == "Damage")
        {
            var checkOut = await _repository.GetInspectionReportAsync(booking.Id, "CheckOut", cancellationToken)
                ?? throw new ValidationException(["Damage disputes require a check-out inspection report."]);
            if (!DisputeWorkflowRules.IsDamageDisputeWindowOpen(checkOut.CreatedAt, null, now))
            {
                throw new ValidationException(["The 48-hour damage dispute window has expired."]);
            }
        }
        var report = new Report
        {
            BookingId = booking.Id,
            ReporterId = userId,
            ReportType = reportType,
            Description = RequireText(request.Description, "Description is required."),
            EvidenceUrls = NormalizeNullable(request.EvidenceUrls),
            Status = "Open",
            CreatedAt = now
        };

        Dispute dispute = null!;
        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            await _repository.AddReportAsync(report, ct);
            await _repository.SaveChangesAsync(ct);

            dispute = new Dispute
            {
                BookingId = booking.Id,
                ReportId = report.Id,
                OpenedBy = userId,
                Status = "Open",
                CompensationDirection = "NoCompensation",
                SettlementMethod = "DepositThenExternal",
                UpdatedAt = now,
                CreatedAt = now
            };

            await _repository.AddDisputeAsync(dispute, ct);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, userId, actorRole, "DisputeCreated", null, JsonSerializer.Serialize(new
            {
                bookingId = booking.Id,
                reportId = report.Id,
                report.ReportType
            }), ct);
        }, cancellationToken);

        await NotifyStaffAsync(dispute, "Tranh chấp mới", $"Booking {booking.BookingCode} vừa có tranh chấp mới.", cancellationToken);
        await NotifyUserAsync(OtherPartyId(booking, userId), dispute, "Booking có tranh chấp mới", $"Booking {booking.BookingCode} vừa được mở tranh chấp.", cancellationToken);

        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<PagedResult<DisputeListItem>> GetMineAsync(long userId, DisputeListRequest request, CancellationToken cancellationToken = default)
    {
        NormalizePaging(request);
        var (items, totalCount) = await _repository.GetUserDisputesAsync(userId, request, cancellationToken);
        return ToPagedResult(items, totalCount, request);
    }

    public async Task<PagedResult<DisputeListItem>> GetStaffQueueAsync(DisputeListRequest request, CancellationToken cancellationToken = default)
    {
        NormalizePaging(request);
        var (items, totalCount) = await _repository.GetStaffQueueAsync(request, cancellationToken);
        return ToPagedResult(items, totalCount, request);
    }

    public async Task<DisputeDetailResponse> GetByIdAsync(long id, long userId, bool isStaffOrAdmin, CancellationToken cancellationToken = default)
    {
        var detail = await GetDetailOrThrowAsync(id, cancellationToken);
        if (!isStaffOrAdmin && detail.CustomerId != userId && detail.OwnerId != userId)
        {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return detail;
    }

    public async Task<DisputeDetailResponse> MarkInvestigatingAsync(long id, long staffId, string actorRole, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureNotResolved(dispute);
        EnsureStatus(dispute, ["Open", "Investigating"], "Dispute cannot be moved to investigating from its current status.");
        var oldStatus = dispute.Status;
        dispute.Status = "Investigating";
        dispute.AssignedStaffId ??= staffId;
        dispute.UpdatedAt = DateTime.UtcNow;

        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            _repository.Update(dispute);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, staffId, actorRole, "DisputeInvestigating", oldStatus, dispute.Status, ct);
        }, cancellationToken);
        await NotifyParticipantsAsync(dispute, "Tranh chấp đang được xử lý", "Nhân viên đã bắt đầu điều tra tranh chấp.", cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> RequestMoreEvidenceAsync(long id, long staffId, string actorRole, RequestMoreEvidenceRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureNotResolved(dispute);
        EnsureStatus(dispute, ["Open", "Investigating", "Escalated"], "Evidence cannot be requested from the current status.");
        if (dispute.Status == "Escalated" && actorRole != "Admin")
        {
            throw new ValidationException(["Only admin can request evidence for an escalated dispute."]);
        }
        EnsureFresh(dispute, request.UpdatedAt);

        var requestedFrom = Normalize(request.RequestedFrom, EvidenceTargets, "");
        if (requestedFrom.Length == 0)
        {
            throw new ValidationException(["RequestedFrom must be Customer, Owner, or Both."]);
        }

        var oldStatus = dispute.Status;
        dispute.Status = "NeedMoreEvidence";
        dispute.AssignedStaffId ??= staffId;
        dispute.EvidenceRequestedFrom = requestedFrom;
        dispute.EvidenceRequestMessage = RequireText(request.Message, "Evidence request message is required.");
        dispute.EvidenceRequestedAt = DateTime.UtcNow;
        dispute.EvidenceRespondedAt = null;
        dispute.UpdatedAt = DateTime.UtcNow;

        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            _repository.Update(dispute);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, staffId, actorRole, "DisputeNeedMoreEvidence", oldStatus, JsonSerializer.Serialize(new
            {
                dispute.EvidenceRequestedFrom,
                dispute.EvidenceRequestMessage
            }), ct);
        }, cancellationToken);
        await NotifyEvidenceTargetsAsync(dispute, requestedFrom, "Can bo sung bang chung", dispute.EvidenceRequestMessage, cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> AddEvidenceAsync(long id, long userId, string actorRole, AddDisputeEvidenceRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureNotResolved(dispute);
        EnsureFresh(dispute, request.UpdatedAt);
        var booking = await _repository.GetBookingByIdAsync(dispute.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.CustomerId != userId && booking.OwnerId != userId)
        {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (dispute.Status != "NeedMoreEvidence")
        {
            throw new ValidationException(["Dispute is not waiting for more evidence."]);
        }

        if (!IsRequestedParty(dispute.EvidenceRequestedFrom, booking, userId))
        {
            throw new ValidationException(["This dispute is waiting for evidence from another party."]);
        }

        var message = RequireText(request.Message, "Evidence message is required.");
        var evidenceUrls = NormalizeNullable(request.EvidenceUrls);
        var submissionRole = booking.CustomerId == userId ? "Customer" : "Owner";
        var oldStatus = dispute.Status;
        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            await _repository.AddEvidenceSubmissionAsync(new DisputeEvidenceSubmission
            {
                DisputeId = dispute.Id,
                SubmittedBy = userId,
                SubmittedRole = submissionRole,
                Message = message,
                EvidenceUrls = evidenceUrls,
                CreatedAt = DateTime.UtcNow
            }, ct);
            if (evidenceUrls is not null && dispute.ReportId.HasValue)
            {
                var report = await _repository.GetReportByIdAsync(dispute.ReportId.Value, ct);
                if (report is not null)
                {
                    report.EvidenceUrls = AppendEvidenceUrls(report.EvidenceUrls, evidenceUrls);
                    _repository.UpdateReport(report);
                }
            }

            var previousSubmissions = (await _repository.GetEvidenceSubmissionsAsync(dispute.Id, ct))
                .Where(item => !dispute.EvidenceRequestedAt.HasValue || item.CreatedAt >= dispute.EvidenceRequestedAt.Value)
                .ToList();
            var respondedRoles = previousSubmissions.Select(item => item.SubmittedRole).Append(submissionRole).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var allRequestedPartiesResponded = DisputeWorkflowRules.HaveAllRequestedPartiesResponded(dispute.EvidenceRequestedFrom, respondedRoles);
            dispute.Status = allRequestedPartiesResponded ? "Investigating" : "NeedMoreEvidence";
            dispute.EvidenceRespondedAt = allRequestedPartiesResponded ? DateTime.UtcNow : null;
            dispute.UpdatedAt = DateTime.UtcNow;

            _repository.Update(dispute);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, userId, actorRole, "DisputeEvidenceSubmitted", oldStatus, JsonSerializer.Serialize(new
            {
                message,
                evidenceUrls
            }), ct);
        }, cancellationToken);

        if (dispute.AssignedStaffId.HasValue)
        {
            await NotifyUserAsync(dispute.AssignedStaffId.Value, dispute, "Da bo sung bang chung", $"Dispute #{dispute.Id} da co bang chung moi.", cancellationToken);
        }

        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> ResolveAsync(long id, long actorId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureNotResolved(dispute);
        EnsureFresh(dispute, request.UpdatedAt);
        EnsureStatus(dispute, ["Open", "Investigating", "Escalated"], "A decision cannot be issued from the current status.");
        if (dispute.Status == "NeedMoreEvidence" && dispute.EvidenceRespondedAt is null)
        {
            throw new ValidationException(["Cannot resolve while waiting for requested evidence."]);
        }

        if (dispute.Status == "Escalated" && actorRole != "Admin")
        {
            throw new ValidationException(["Only admin can resolve an escalated dispute."]);
        }

        var booking = await _repository.GetBookingByIdAsync(dispute.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");
        ValidateCompensation(booking, request, actorRole == "Admin", useAdminAmount: false);
        var availablePlatformAmount = await GetAvailablePlatformSettlementAsync(booking, cancellationToken);

        var oldStatus = dispute.Status;
        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            ApplyDecision(dispute, request, actorId, actorRole == "Admin", availablePlatformAmount);
            if (dispute.Status == "Resolved")
            {
                await ApplyPlatformFeeRevenueAsync(booking, DateTime.UtcNow, ct);
                await ApplyRemainingDepositRefundAsync(dispute, booking, DateTime.UtcNow, ct);
            }
            dispute.AssignedStaffId ??= actorId;
            _repository.Update(dispute);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, actorId, actorRole, "DisputeDecisionIssued", oldStatus, JsonSerializer.Serialize(new
            {
                dispute.Status,
                dispute.Resolution,
                dispute.CompensationDirection,
                dispute.SettlementMethod,
                dispute.CompensationAmount,
                dispute.AdminApprovedAmount,
                dispute.PlatformSettledAmount,
                dispute.ExternalSettlementAmount
            }), ct);
        }, cancellationToken);
        await NotifyParticipantsAsync(dispute, "Tranh chấp đã có phán quyết", dispute.Resolution ?? "Tranh chấp đã có phán quyết.", cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> EscalateAsync(long id, long staffId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureNotResolved(dispute);
        EnsureFresh(dispute, request.UpdatedAt);
        EnsureStatus(dispute, ["Open", "Investigating"], "Dispute cannot be escalated from its current status.");
        var booking = await _repository.GetBookingByIdAsync(dispute.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");
        ValidateCompensation(booking, request, isAdmin: true, useAdminAmount: false);

        var oldStatus = dispute.Status;
        dispute.Status = "Escalated";
        dispute.AssignedStaffId ??= staffId;
        dispute.EscalatedBy = staffId;
        dispute.EscalatedAt = DateTime.UtcNow;
        dispute.Resolution = NormalizeNullable(request.Resolution) ?? dispute.Resolution;
        dispute.CompensationDirection = Normalize(request.CompensationDirection, CompensationDirections, dispute.CompensationDirection);
        dispute.SettlementMethod = dispute.CompensationDirection == "CustomerPaysOwner"
            ? Normalize(request.SettlementMethod, SettlementMethods, "DepositThenExternal")
            : "ExternalOnly";
        dispute.CompensationAmount = request.CompensationAmount ?? dispute.CompensationAmount;
        dispute.UpdatedAt = DateTime.UtcNow;

        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            _repository.Update(dispute);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, staffId, actorRole, "DisputeEscalated", oldStatus, dispute.Resolution, ct);
        }, cancellationToken);
        await NotifyAdminsAsync(dispute, "Tranh chấp cần Admin xử lý", $"Dispute #{dispute.Id} đã được escalated.", cancellationToken);
        await NotifyParticipantsAsync(dispute, "Tranh chấp đã chuyển Admin", "Hồ sơ tranh chấp đã được chuyển Admin xem xét.", cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> AdminOverrideAsync(long id, long adminId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureNotResolved(dispute);
        EnsureFresh(dispute, request.UpdatedAt);
        EnsureStatus(dispute, ["Open", "Investigating", "Escalated"], "A decision cannot be issued from the current status.");
        var booking = await _repository.GetBookingByIdAsync(dispute.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");
        ValidateCompensation(booking, request, isAdmin: true, useAdminAmount: true);
        var availablePlatformAmount = await GetAvailablePlatformSettlementAsync(booking, cancellationToken);

        var oldStatus = dispute.Status;
        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            ApplyDecision(dispute, request, adminId, isAdmin: true, availablePlatformAmount);
            if (dispute.Status == "Resolved")
            {
                await ApplyPlatformFeeRevenueAsync(booking, DateTime.UtcNow, ct);
                await ApplyRemainingDepositRefundAsync(dispute, booking, DateTime.UtcNow, ct);
            }
            _repository.Update(dispute);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, adminId, actorRole, "DisputeAdminOverride", oldStatus, JsonSerializer.Serialize(new
            {
                dispute.Status,
                dispute.Resolution,
                dispute.CompensationDirection,
                dispute.SettlementMethod,
                dispute.AdminApprovedAmount,
                dispute.PlatformSettledAmount,
                dispute.ExternalSettlementAmount
            }), ct);
        }, cancellationToken);
        await NotifyParticipantsAsync(dispute, "Admin đã đưa phán quyết", dispute.Resolution ?? "Tranh chấp đã được Admin xử lý.", cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> ConfirmExternalSettlementAsync(long id, long userId, string actorRole, ConfirmExternalSettlementRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        if (dispute.Status != "AwaitingExternalSettlement")
        {
            throw new ValidationException(["Dispute is not awaiting external settlement confirmation."]);
        }

        var booking = await _repository.GetBookingByIdAsync(dispute.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");
        var confirmationRole = actorRole;
        if (booking.CustomerId == userId)
        {
            if (dispute.CustomerExternalConfirmed)
            {
                return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
            }
            confirmationRole = "Customer";
        }
        else if (booking.OwnerId == userId)
        {
            if (dispute.OwnerExternalConfirmed)
            {
                return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
            }
            confirmationRole = "Owner";
        }
        else
        {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        EnsureFresh(dispute, request.UpdatedAt);
        var now = DateTime.UtcNow;
        if (confirmationRole == "Customer")
        {
            dispute.CustomerExternalConfirmed = true;
            dispute.CustomerExternalConfirmedAt = now;
        }
        else
        {
            dispute.OwnerExternalConfirmed = true;
            dispute.OwnerExternalConfirmedAt = now;
        }

        var oldStatus = dispute.Status;
        var platformPayoutCompleted = false;
        var platformFeeCredited = 0m;
        var refundedDepositAmount = 0m;
        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            if (confirmationRole == "Customer")
            {
                platformFeeCredited = await ApplyPlatformFeeRevenueAsync(booking, now, ct);
                if (dispute.CompensationDirection == "CustomerPaysOwner")
                {
                    var wasCompleted = dispute.PlatformSettlementCompletedAt.HasValue;
                    await ApplyPlatformPayoutAsync(dispute, booking, now, ct);
                    platformPayoutCompleted = !wasCompleted && dispute.PlatformSettlementCompletedAt.HasValue;
                }
                refundedDepositAmount = await ApplyRemainingDepositRefundAsync(dispute, booking, now, ct);
                if (dispute.PlatformSettledAmount > 0m && dispute.ExternalSettlementAmount == 0m)
                {
                    dispute.OwnerExternalConfirmed = true;
                    dispute.OwnerExternalConfirmedAt = now;
                }
            }

            if (dispute.CustomerExternalConfirmed && dispute.OwnerExternalConfirmed)
            {
                CloseDispute(dispute, userId, null, now);
            }
            dispute.UpdatedAt = now;
            _repository.Update(dispute);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, userId, confirmationRole, "ExternalSettlementConfirmed", oldStatus, dispute.Status, ct);
        }, cancellationToken);
        if (platformPayoutCompleted)
        {
            await NotifyUserAsync(
                booking.OwnerId,
                dispute,
                "Đã nhận tiền bồi thường",
                $"Nền tảng đã chuyển {dispute.PlatformSettledAmount:N0}đ từ tiền cọc booking {booking.BookingCode} vào ví của bạn.",
                cancellationToken);
        }
        if (platformFeeCredited > 0m)
        {
            foreach (var adminId in await _repository.GetAdminUserIdsAsync(cancellationToken))
            {
                await NotifyUserAsync(
                    adminId,
                    dispute,
                    "Đã ghi nhận phí nền tảng",
                    $"Nền tảng đã ghi nhận {platformFeeCredited:N0}đ phí của booking {booking.BookingCode}.",
                    cancellationToken);
                break;
            }
        }
        if (refundedDepositAmount > 0m)
        {
            await NotifyUserAsync(
                booking.CustomerId,
                dispute,
                "Đã hoàn phần tiền cọc còn dư",
                $"Nền tảng đã hoàn {refundedDepositAmount:N0}đ tiền cọc còn dư của booking {booking.BookingCode} vào ví của bạn.",
                cancellationToken);
        }
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> AdminCloseAsync(long id, long adminId, AdminCloseDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureFresh(dispute, request.UpdatedAt);
        if (dispute.Status != "AwaitingExternalSettlement")
        {
            throw new ValidationException(["Only a dispute awaiting external settlement can be force-closed."]);
        }

        var reason = RequireText(request.Reason, "Admin close reason is required.");
        var booking = await _repository.GetBookingByIdAsync(dispute.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");
        var oldStatus = dispute.Status;
        await _repository.ExecuteInTransactionAsync(async ct =>
        {
            var now = DateTime.UtcNow;
            await ApplyPlatformFeeRevenueAsync(booking, now, ct);
            if (dispute.CompensationDirection == "CustomerPaysOwner")
            {
                await ApplyPlatformPayoutAsync(dispute, booking, now, ct);
            }
            await ApplyRemainingDepositRefundAsync(dispute, booking, now, ct);
            CloseDispute(dispute, adminId, reason, now);
            _repository.Update(dispute);
            await _repository.SaveChangesAsync(ct);
            await AddAuditAsync(dispute.Id, adminId, "Admin", "DisputeAdminClosed", oldStatus, reason, ct);
        }, cancellationToken);
        await NotifyParticipantsAsync(dispute, "Tranh chấp đã được đóng", reason, cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    private async Task<Dispute> GetMutableOrThrowAsync(long id, CancellationToken cancellationToken)
        => await _repository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Dispute not found.");

    private async Task<DisputeDetailResponse> GetDetailOrThrowAsync(long id, CancellationToken cancellationToken)
        => await _repository.GetDetailByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Dispute not found.");

    private async Task AddAuditAsync(long disputeId, long? actorId, string actorRole, string action, string? oldValue, string? newValue, CancellationToken cancellationToken)
    {
        await _repository.AddAuditLogAsync(new AuditLog
        {
            ActorId = actorId,
            ActorRole = actorRole,
            Action = action,
            EntityType = "Dispute",
            EntityId = disputeId,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private async Task NotifyParticipantsAsync(Dispute dispute, string title, string body, CancellationToken cancellationToken)
    {
        var booking = await _repository.GetBookingByIdAsync(dispute.BookingId, cancellationToken);
        if (booking is null)
        {
            return;
        }

        await NotifyUserAsync(booking.CustomerId, dispute, title, body, cancellationToken);
        await NotifyUserAsync(booking.OwnerId, dispute, title, body, cancellationToken);
    }

    private async Task NotifyEvidenceTargetsAsync(Dispute dispute, string requestedFrom, string title, string body, CancellationToken cancellationToken)
    {
        var booking = await _repository.GetBookingByIdAsync(dispute.BookingId, cancellationToken);
        if (booking is null)
        {
            return;
        }

        if (requestedFrom is "Customer" or "Both")
        {
            await NotifyUserAsync(booking.CustomerId, dispute, title, body, cancellationToken);
        }

        if (requestedFrom is "Owner" or "Both")
        {
            await NotifyUserAsync(booking.OwnerId, dispute, title, body, cancellationToken);
        }
    }

    private async Task NotifyStaffAsync(Dispute dispute, string title, string body, CancellationToken cancellationToken)
    {
        var staffIds = (await _repository.GetStaffUserIdsAsync(cancellationToken))
            .Concat(await _repository.GetAdminUserIdsAsync(cancellationToken))
            .Distinct();

        foreach (var userId in staffIds)
        {
            await NotifyUserAsync(userId, dispute, title, body, cancellationToken);
        }
    }

    private async Task NotifyAdminsAsync(Dispute dispute, string title, string body, CancellationToken cancellationToken)
    {
        foreach (var userId in await _repository.GetAdminUserIdsAsync(cancellationToken))
        {
            await NotifyUserAsync(userId, dispute, title, body, cancellationToken);
        }
    }

    private async Task NotifyUserAsync(long userId, Dispute dispute, string title, string body, CancellationToken cancellationToken)
    {
        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = userId,
            Type = "Dispute",
            Title = title,
            Body = body,
            DataJson = JsonSerializer.Serialize(new
            {
                disputeId = dispute.Id,
                bookingId = dispute.BookingId,
                status = dispute.Status
            }),
            Channel = "InApp"
        }, cancellationToken);
    }

    private async Task<decimal> GetAvailablePlatformSettlementAsync(Booking booking, CancellationToken cancellationToken)
    {
        var completedDisputePayouts = await _repository.GetCompletedPlatformSettlementForBookingAsync(booking.Id, cancellationToken);
        var completedDepositRefunds = await _repository.GetCompletedDepositRefundForBookingAsync(booking.Id, cancellationToken);
        return DisputeDepositCalculator.GetAvailableAmount(
            booking.DepositAmount,
            booking.PlatformFee,
            completedDisputePayouts,
            completedDepositRefunds);
    }

    private async Task ApplyPlatformPayoutAsync(Dispute dispute, Booking booking, DateTime completedAt, CancellationToken cancellationToken)
    {
        if (dispute.PlatformSettledAmount <= 0m || dispute.PlatformSettlementCompletedAt.HasValue)
        {
            return;
        }

        var idempotencyKey = $"dispute_compensation_{dispute.Id}";
        if (await _walletRepository.TransactionExistsAsync(idempotencyKey, cancellationToken))
        {
            dispute.PlatformSettlementCompletedAt = completedAt;
            return;
        }

        var ownerWallet = (await _walletRepository.FindAsync(wallet => wallet.UserId == booking.OwnerId, cancellationToken)).FirstOrDefault();
        if (ownerWallet is null)
        {
            ownerWallet = new Wallet { UserId = booking.OwnerId };
            await _walletRepository.AddAsync(ownerWallet, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        ownerWallet.Balance += dispute.PlatformSettledAmount;
        ownerWallet.TotalEarned += dispute.PlatformSettledAmount;
        ownerWallet.UpdatedAt = completedAt;
        _walletRepository.Update(ownerWallet);
        await _walletRepository.AddTransactionAsync(new WalletTransaction
        {
            WalletId = ownerWallet.Id,
            Type = WalletTransactionType.DisputeCompensation,
            Amount = dispute.PlatformSettledAmount,
            BalanceAfter = ownerWallet.Balance,
            ReferenceId = dispute.Id,
            IdempotencyKey = idempotencyKey,
            Note = $"Bồi thường dispute #{dispute.Id} từ tiền cọc booking {booking.BookingCode}",
            Status = "Completed"
        }, cancellationToken);
        dispute.PlatformSettlementCompletedAt = completedAt;
    }

    private async Task<decimal> ApplyPlatformFeeRevenueAsync(
        Booking booking,
        DateTime completedAt,
        CancellationToken cancellationToken)
    {
        var feeAmount = Math.Min(Math.Max(booking.PlatformFee, 0m), Math.Max(booking.DepositAmount, 0m));
        if (feeAmount <= 0m)
        {
            return 0m;
        }

        var idempotencyKey = $"booking_platform_fee_{booking.Id}";
        if (await _walletRepository.TransactionExistsAsync(idempotencyKey, cancellationToken))
        {
            return 0m;
        }

        var adminId = (await _repository.GetAdminUserIdsAsync(cancellationToken)).OrderBy(id => id).FirstOrDefault();
        if (adminId <= 0)
        {
            throw new ValidationException(["Cannot settle platform fee because no admin account exists."]);
        }

        var adminWallet = (await _walletRepository.FindAsync(wallet => wallet.UserId == adminId, cancellationToken)).FirstOrDefault();
        if (adminWallet is null)
        {
            adminWallet = new Wallet { UserId = adminId };
            await _walletRepository.AddAsync(adminWallet, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        adminWallet.Balance += feeAmount;
        adminWallet.TotalEarned += feeAmount;
        adminWallet.UpdatedAt = completedAt;
        _walletRepository.Update(adminWallet);
        await _walletRepository.AddTransactionAsync(new WalletTransaction
        {
            WalletId = adminWallet.Id,
            Type = WalletTransactionType.PlatformFeeRevenue,
            Amount = feeAmount,
            BalanceAfter = adminWallet.Balance,
            ReferenceId = booking.Id,
            IdempotencyKey = idempotencyKey,
            Note = $"Phí nền tảng từ booking {booking.BookingCode}",
            Status = "Completed"
        }, cancellationToken);

        return feeAmount;
    }

    private async Task<decimal> ApplyRemainingDepositRefundAsync(
        Dispute dispute,
        Booking booking,
        DateTime completedAt,
        CancellationToken cancellationToken)
    {
        var idempotencyKey = $"dispute_deposit_refund_{dispute.Id}";
        if (await _walletRepository.TransactionExistsAsync(idempotencyKey, cancellationToken))
        {
            return 0m;
        }

        var previousDisputePayouts = await _repository.GetCompletedPlatformSettlementForBookingAsync(booking.Id, cancellationToken);
        var completedDepositRefunds = await _repository.GetCompletedDepositRefundForBookingAsync(booking.Id, cancellationToken);
        var refundAmount = DisputeDepositCalculator.GetAvailableAmount(
            booking.DepositAmount,
            booking.PlatformFee,
            previousDisputePayouts + dispute.PlatformSettledAmount,
            completedDepositRefunds);
        if (refundAmount <= 0m)
        {
            return 0m;
        }

        var customerWallet = (await _walletRepository.FindAsync(wallet => wallet.UserId == booking.CustomerId, cancellationToken)).FirstOrDefault();
        if (customerWallet is null)
        {
            customerWallet = new Wallet { UserId = booking.CustomerId };
            await _walletRepository.AddAsync(customerWallet, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        customerWallet.Balance += refundAmount;
        customerWallet.TotalSpent = Math.Max(customerWallet.TotalSpent - refundAmount, 0m);
        customerWallet.UpdatedAt = completedAt;
        _walletRepository.Update(customerWallet);
        await _walletRepository.AddTransactionAsync(new WalletTransaction
        {
            WalletId = customerWallet.Id,
            Type = WalletTransactionType.Refund,
            Amount = refundAmount,
            BalanceAfter = customerWallet.Balance,
            ReferenceId = dispute.Id,
            IdempotencyKey = idempotencyKey,
            Note = $"Hoàn tiền cọc còn dư dispute #{dispute.Id} của booking {booking.BookingCode}",
            Status = "Completed"
        }, cancellationToken);

        return refundAmount;
    }

    private static void ApplyDecision(Dispute dispute, ResolveDisputeRequest request, long actorId, bool isAdmin, decimal availablePlatformAmount)
    {
        var now = DateTime.UtcNow;
        dispute.Resolution = RequireText(request.Resolution, "Resolution is required.");
        dispute.CompensationDirection = Normalize(request.CompensationDirection, CompensationDirections, "NoCompensation");
        dispute.SettlementMethod = dispute.CompensationDirection == "CustomerPaysOwner"
            ? Normalize(request.SettlementMethod, SettlementMethods, "DepositThenExternal")
            : "ExternalOnly";
        var decisionAmount = dispute.CompensationDirection == "NoCompensation" ? 0m : request.CompensationAmount ?? 0m;
        if (dispute.CompensationDirection == "NoCompensation")
        {
            dispute.CompensationAmount = null;
            dispute.AdminApprovedAmount = null;
        }
        else if (isAdmin)
        {
            dispute.AdminApprovedAmount = request.CompensationAmount;
        }
        else
        {
            dispute.CompensationAmount = request.CompensationAmount;
        }

        var breakdown = DisputeSettlementCalculator.Calculate(
            dispute.CompensationDirection,
            dispute.SettlementMethod,
            decisionAmount,
            availablePlatformAmount);
        dispute.PlatformSettledAmount = breakdown.PlatformAmount;
        dispute.ExternalSettlementAmount = breakdown.ExternalAmount;
        dispute.PlatformSettlementCompletedAt = null;
        dispute.DecidedBy = actorId;
        dispute.DecisionIssuedAt = now;
        dispute.Status = "DecisionIssued";
        dispute.UpdatedAt = now;

        if (decisionAmount > 0)
        {
            dispute.Status = "AwaitingExternalSettlement";
        }
        else
        {
            CloseDispute(dispute, actorId, null, now);
        }
    }

    private static void CloseDispute(Dispute dispute, long actorId, string? adminReason, DateTime now)
    {
        dispute.Status = "Resolved";
        dispute.ResolvedAt = now;
        dispute.ClosedAt = now;
        dispute.ClosedBy = actorId;
        dispute.AdminCloseReason = adminReason;
        dispute.UpdatedAt = now;
    }

    private static void EnsureNotResolved(Dispute dispute)
    {
        if (dispute.Status == "Resolved")
        {
            throw new ValidationException(["Dispute is already resolved."]);
        }
    }

    private static void EnsureFresh(Dispute dispute, DateTime? expectedUpdatedAt)
    {
        if (!expectedUpdatedAt.HasValue)
        {
            return;
        }

        var delta = (dispute.UpdatedAt - expectedUpdatedAt.Value).Duration();
        if (delta > TimeSpan.FromSeconds(1))
        {
            throw new ValidationException(["Dispute was updated by someone else. Please reload before saving."]);
        }
    }

    private static void EnsureStatus(Dispute dispute, string[] allowedStatuses, string message)
    {
        if (!allowedStatuses.Contains(dispute.Status, StringComparer.OrdinalIgnoreCase))
        {
            throw new ValidationException([message]);
        }
    }

    private static void ValidateCompensation(Booking booking, ResolveDisputeRequest request, bool isAdmin, bool useAdminAmount)
    {
        var direction = Normalize(request.CompensationDirection, CompensationDirections, "NoCompensation");
        if (direction == "NoCompensation")
        {
            return;
        }

        if (!request.CompensationAmount.HasValue)
        {
            throw new ValidationException(["Compensation amount is required."]);
        }

        if (request.CompensationAmount.Value < 0)
        {
            throw new ValidationException(["Compensation amount cannot be negative."]);
        }

        var heldSecurityAmount = DisputeDepositCalculator.GetAvailableAmount(
            booking.DepositAmount,
            booking.PlatformFee,
            completedDisputePayouts: 0m);
        if (request.CompensationAmount.Value > heldSecurityAmount && !isAdmin)
        {
            throw new ValidationException(["Staff cannot set compensation above the held security amount after platform fee."]);
        }

        if (useAdminAmount && !isAdmin)
        {
            throw new ValidationException(["Only admin can set admin approved amount."]);
        }
    }

    private static bool IsRequestedParty(string? requestedFrom, Booking booking, long userId)
        => requestedFrom == "Both"
            || (requestedFrom == "Customer" && booking.CustomerId == userId)
            || (requestedFrom == "Owner" && booking.OwnerId == userId);

    private static string AppendEvidenceUrls(string? current, string newUrls)
        => string.IsNullOrWhiteSpace(current)
            ? newUrls.Trim()
            : $"{current.Trim()}\n{newUrls.Trim()}";

    private static long OtherPartyId(Booking booking, long userId)
        => booking.CustomerId == userId ? booking.OwnerId : booking.CustomerId;

    private static void NormalizePaging(DisputeListRequest request)
    {
        request.Page = Math.Max(request.Page, 1);
        request.PageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);
        request.Status = NormalizeNullable(request.Status);
        request.Keyword = NormalizeNullable(request.Keyword);
    }

    private static PagedResult<DisputeListItem> ToPagedResult(List<DisputeListItem> items, int totalCount, DisputeListRequest request)
        => new()
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };

    private static string RequireText(string? value, string message)
    {
        var normalized = NormalizeNullable(value);
        if (normalized is null)
        {
            throw new ValidationException([message]);
        }

        return normalized;
    }

    private static string? NormalizeNullable(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string Normalize(string? value, string[] allowed, string fallback)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return fallback;
        }

        return allowed.FirstOrDefault(option => string.Equals(option, value.Trim(), StringComparison.OrdinalIgnoreCase)) ?? fallback;
    }
}
