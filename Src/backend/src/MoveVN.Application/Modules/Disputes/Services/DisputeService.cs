using System.Text.Json;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Disputes.DTOs;
using MoveVN.Application.Modules.Disputes.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Disputes.Services;

public class DisputeService : IDisputeService
{
    private const int MaxPageSize = 50;
    private static readonly string[] Statuses = ["Open", "Investigating", "Resolved", "Escalated"];

    private readonly IDisputeRepository _repository;
    private readonly INotificationService _notificationService;

    public DisputeService(IDisputeRepository repository, INotificationService notificationService)
    {
        _repository = repository;
        _notificationService = notificationService;
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
        var report = new Report
        {
            BookingId = booking.Id,
            ReporterId = userId,
            ReportType = NormalizeNullable(request.ReportType) ?? "Dispute",
            Description = RequireText(request.Description, "Description is required."),
            EvidenceUrls = NormalizeNullable(request.EvidenceUrls),
            Status = "Open",
            CreatedAt = now
        };

        await _repository.AddReportAsync(report, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        var dispute = new Dispute
        {
            BookingId = booking.Id,
            ReportId = report.Id,
            OpenedBy = userId,
            Status = "Open",
            CreatedAt = now
        };

        await _repository.AddDisputeAsync(dispute, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        await AddAuditAsync(dispute.Id, userId, actorRole, "DisputeCreated", null, JsonSerializer.Serialize(new
        {
            bookingId = booking.Id,
            reportId = report.Id,
            report.ReportType
        }), cancellationToken);

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
        var oldStatus = dispute.Status;
        dispute.Status = "Investigating";
        dispute.AssignedStaffId ??= staffId;

        _repository.Update(dispute);
        await _repository.SaveChangesAsync(cancellationToken);
        await AddAuditAsync(dispute.Id, staffId, actorRole, "DisputeInvestigating", oldStatus, dispute.Status, cancellationToken);
        await NotifyParticipantsAsync(dispute, "Tranh chấp đang được xử lý", "Nhân viên đã bắt đầu điều tra tranh chấp.", cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> ResolveAsync(long id, long actorId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureNotResolved(dispute);
        var oldStatus = dispute.Status;
        ApplyResolution(dispute, request, "Resolved");
        dispute.AssignedStaffId ??= actorId;

        _repository.Update(dispute);
        await _repository.SaveChangesAsync(cancellationToken);
        await AddAuditAsync(dispute.Id, actorId, actorRole, "DisputeResolved", oldStatus, JsonSerializer.Serialize(new
        {
            dispute.Status,
            dispute.Resolution,
            dispute.CompensationAmount
        }), cancellationToken);
        await NotifyParticipantsAsync(dispute, "Tranh chấp đã được giải quyết", dispute.Resolution ?? "Tranh chấp đã có phán quyết.", cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> EscalateAsync(long id, long staffId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        EnsureNotResolved(dispute);
        var oldStatus = dispute.Status;
        dispute.Status = "Escalated";
        dispute.AssignedStaffId ??= staffId;
        dispute.Resolution = NormalizeNullable(request.Resolution) ?? dispute.Resolution;
        dispute.CompensationAmount = request.CompensationAmount ?? dispute.CompensationAmount;

        _repository.Update(dispute);
        await _repository.SaveChangesAsync(cancellationToken);
        await AddAuditAsync(dispute.Id, staffId, actorRole, "DisputeEscalated", oldStatus, dispute.Resolution, cancellationToken);
        await NotifyAdminsAsync(dispute, "Tranh chấp cần Admin xử lý", $"Dispute #{dispute.Id} đã được escalated.", cancellationToken);
        await NotifyParticipantsAsync(dispute, "Tranh chấp đã chuyển Admin", "Hồ sơ tranh chấp đã được chuyển Admin xem xét.", cancellationToken);
        return await GetDetailOrThrowAsync(dispute.Id, cancellationToken);
    }

    public async Task<DisputeDetailResponse> AdminOverrideAsync(long id, long adminId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await GetMutableOrThrowAsync(id, cancellationToken);
        var oldStatus = dispute.Status;
        ApplyResolution(dispute, request, "Resolved");

        _repository.Update(dispute);
        await _repository.SaveChangesAsync(cancellationToken);
        await AddAuditAsync(dispute.Id, adminId, actorRole, "DisputeAdminOverride", oldStatus, JsonSerializer.Serialize(new
        {
            dispute.Status,
            dispute.Resolution,
            dispute.CompensationAmount
        }), cancellationToken);
        await NotifyParticipantsAsync(dispute, "Admin đã đưa phán quyết", dispute.Resolution ?? "Tranh chấp đã được Admin xử lý.", cancellationToken);
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

    private static void ApplyResolution(Dispute dispute, ResolveDisputeRequest request, string status)
    {
        dispute.Status = status;
        dispute.Resolution = RequireText(request.Resolution, "Resolution is required.");
        dispute.CompensationAmount = request.CompensationAmount;
        dispute.ResolvedAt = DateTime.UtcNow;
    }

    private static void EnsureNotResolved(Dispute dispute)
    {
        if (dispute.Status == "Resolved")
        {
            throw new ValidationException(["Dispute is already resolved."]);
        }
    }

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
}
