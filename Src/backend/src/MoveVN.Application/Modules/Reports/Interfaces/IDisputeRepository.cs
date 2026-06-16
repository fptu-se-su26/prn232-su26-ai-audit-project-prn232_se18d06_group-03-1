using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Reports.Interfaces;

public interface IDisputeRepository
{
    Task<Dispute?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(Dispute dispute, CancellationToken cancellationToken = default);
    void Update(Dispute dispute);
    Task<Booking?> GetBookingAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<PagedResult<DisputeResponse>> GetPagedAsync(string? status, int page, int pageSize, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
