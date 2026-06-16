using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;
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
            ?? throw new NotFoundException("Booking không tồn tại.");

        var dispute = new Dispute
        {
            BookingId = request.BookingId,
            OpenedBy = openedBy,
            Status = "Open"
        };

        await _repo.AddAsync(dispute, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _auditLog.LogAsync(openedBy, "User", "OpenDispute", "Dispute", dispute.Id));

        return MapToDto(dispute);
    }

    public async Task<DisputeResponse> ResolveAsync(long disputeId, long staffId, ResolveDisputeRequest request, CancellationToken cancellationToken = default)
    {
        var dispute = await _repo.GetByIdAsync(disputeId, cancellationToken)
            ?? throw new NotFoundException("Dispute không tồn tại.");

        var oldStatus = dispute.Status;
        dispute.Status = request.Escalate ? "Escalated" : "Resolved";
        dispute.Resolution = request.Resolution;
        dispute.CompensationAmount = request.CompensationAmount;
        dispute.ResolvedAt = DateTime.UtcNow;
        dispute.AssignedStaffId = staffId;

        _repo.Update(dispute);
        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _auditLog.LogAsync(staffId, "Staff", "ResolveDispute", "Dispute", disputeId, oldStatus, dispute.Status));

        return MapToDto(dispute);
    }

    public async Task<DisputeResponse> GetByIdAsync(long disputeId, CancellationToken cancellationToken = default)
    {
        var dispute = await _repo.GetByIdAsync(disputeId, cancellationToken)
            ?? throw new NotFoundException("Dispute không tồn tại.");
        return MapToDto(dispute);
    }

    public async Task<PagedResult<DisputeResponse>> GetListAsync(string? status, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _repo.GetPagedAsync(status, page, pageSize, cancellationToken);
    }

    private static DisputeResponse MapToDto(Dispute d) => new()
    {
        Id = d.Id,
        BookingId = d.BookingId,
        OpenedBy = d.OpenedBy,
        AssignedStaffId = d.AssignedStaffId,
        Status = d.Status,
        Resolution = d.Resolution,
        CompensationAmount = d.CompensationAmount,
        ResolvedAt = d.ResolvedAt,
        CreatedAt = d.CreatedAt
    };
}
