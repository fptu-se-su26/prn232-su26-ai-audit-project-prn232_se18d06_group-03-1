using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Bookings.Interfaces;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(Booking booking, CancellationToken cancellationToken = default);
    void Update(Booking booking);
    Task<bool> HasOverlapAsync(long vehicleId, DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken = default);
    Task<Vehicle?> GetVehicleAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task AddStatusHistoryAsync(BookingStatusHistory history, CancellationToken cancellationToken = default);
    Task<List<BookingStatusHistoryDto>> GetStatusHistoryAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<string?> GetContractUrlAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<PagedResult<BookingResponse>> GetByCustomerPagedAsync(long customerId, BookingQueryRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<BookingResponse>> GetByVehiclePagedAsync(long vehicleId, long ownerId, BookingQueryRequest request, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetExpiredPendingAsync(DateTime threshold, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
