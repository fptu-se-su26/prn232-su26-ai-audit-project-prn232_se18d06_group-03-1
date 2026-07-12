using MoveVN.Application.Modules.Disputes.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Disputes.Interfaces;

public interface IDisputeRepository
{
    Task<Booking?> GetBookingByIdAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<Dispute?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<bool> HasOpenDisputeForBookingAsync(long bookingId, CancellationToken cancellationToken = default);
    Task AddDisputeAsync(Dispute dispute, CancellationToken cancellationToken = default);
    Task AddReportAsync(Report report, CancellationToken cancellationToken = default);
    Task AddAuditLogAsync(AuditLog auditLog, CancellationToken cancellationToken = default);
    void Update(Dispute dispute);
    Task<(List<DisputeListItem> Items, int TotalCount)> GetUserDisputesAsync(long userId, DisputeListRequest request, CancellationToken cancellationToken = default);
    Task<(List<DisputeListItem> Items, int TotalCount)> GetStaffQueueAsync(DisputeListRequest request, CancellationToken cancellationToken = default);
    Task<DisputeDetailResponse?> GetDetailByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<List<long>> GetStaffUserIdsAsync(CancellationToken cancellationToken = default);
    Task<List<long>> GetAdminUserIdsAsync(CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
