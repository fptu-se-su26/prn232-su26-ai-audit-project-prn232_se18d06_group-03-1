using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Application.Modules.Reports.Interfaces;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Reports.Services;

public class DisputeService : IDisputeService
{
    private readonly IDisputeRepository _repo;
    private readonly INotificationService _notifications;
    private readonly IAuditLogService _auditLog;

    public DisputeService(IDisputeRepository repo, INotificationService notifications, IAuditLogService auditLog)
    {
        _repo = repo;
        _notifications = notifications;
        _auditLog = auditLog;
    }

    public async Task<DisputeResponse> OpenAsync(CreateDisputeRequest request, long openedBy, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetBookingAsync(request.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");

        var dispute = new Dispute
        {
            BookingId = booking.Id,
            OpenedBy = openedBy,
            Status = "Open"
        };

        await _repo.AddAsync(dispute, cancellationToken);
        foreach (var url in request.EvidenceUrls.Where(x => !string.IsNullOrWhiteSpace(x)))
        {
            await _repo.AddEvidenceAsync(new DisputeEvidence
            {
                DisputeId = dispute.Id,
                EvidenceUrl = url
            }, cancellationToken);
        }
        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _auditLog.LogAsync(openedBy, "User", "OpenDispute", "Dispute", dispute.Id));
        return await MapToDtoAsync(dispute, request.Description, cancellationToken);
    }

    public async Task<DisputeResponse> ResolveAsync(long disputeId, long staffId, ResolveDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await _repo.GetByIdAsync(disputeId, cancellationToken)
            ?? throw new NotFoundException("Dispute not found.");

        var oldStatus = dispute.Status;
        dispute.Status = request.Escalate ? "Escalated" : "Resolved";
        dispute.Resolution = request.Resolution;
        dispute.CompensationAmount = request.CompensationAmount;
        dispute.ResolvedAt = DateTime.UtcNow;
        dispute.AssignedStaffId = staffId;

        _repo.Update(dispute);
        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _auditLog.LogAsync(staffId, "Staff", "ResolveDispute", "Dispute", disputeId, oldStatus, dispute.Status));
        return await MapToDtoAsync(dispute, null, cancellationToken);
    }

    public async Task<DisputeResponse> GetByIdAsync(long disputeId, CancellationToken cancellationToken = default)
    {
        var dispute = await _repo.GetByIdAsync(disputeId, cancellationToken)
            ?? throw new NotFoundException("Dispute not found.");
        return await MapToDtoAsync(dispute, null, cancellationToken);
    }

    public Task<PagedResult<DisputeResponse>> GetListAsync(string? status, int page, int pageSize, CancellationToken cancellationToken = default)
        => _repo.GetPagedAsync(status, page, pageSize, cancellationToken);

    private async Task<DisputeResponse> MapToDtoAsync(Dispute dispute, string? description, CancellationToken cancellationToken)
    {
        var evidenceUrls = await _repo.GetEvidenceUrlsAsync(dispute.Id, cancellationToken);
        return new DisputeResponse
        {
            Id = dispute.Id,
            BookingId = dispute.BookingId,
            OpenedBy = dispute.OpenedBy,
            AssignedStaffId = dispute.AssignedStaffId,
            Status = dispute.Status,
            Description = description,
            Resolution = dispute.Resolution,
            CompensationAmount = dispute.CompensationAmount,
            EvidenceUrls = evidenceUrls,
            Timeline = BuildTimeline(dispute),
            ResolvedAt = dispute.ResolvedAt,
            CreatedAt = dispute.CreatedAt
        };
    }

    private static List<string> BuildTimeline(Dispute dispute)
    {
        var timeline = new List<string> { $"Opened at {dispute.CreatedAt:u}" };
        if (dispute.AssignedStaffId.HasValue)
            timeline.Add($"Assigned to staff #{dispute.AssignedStaffId.Value}");
        if (dispute.Status == "Escalated")
            timeline.Add("Escalated to admin");
        if (dispute.ResolvedAt.HasValue)
            timeline.Add($"Resolved at {dispute.ResolvedAt:u}");
        return timeline;
    }
}
