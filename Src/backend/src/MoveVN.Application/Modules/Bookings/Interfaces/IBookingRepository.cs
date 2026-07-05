using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Bookings.Interfaces;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(Booking booking, CancellationToken cancellationToken = default);
    void Update(Booking booking);
    Task<bool> HasOverlapAsync(long vehicleId, DateOnly startDate, DateOnly endDate, long? excludeBookingId = null, CancellationToken cancellationToken = default);
    Task<Vehicle?> GetVehicleByIdAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task AddStatusHistoryAsync(BookingStatusHistory history, CancellationToken cancellationToken = default);
    Task<List<BookingStatusHistoryDto>> GetStatusHistoryAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<(List<BookingResponse> Items, int TotalCount)> GetByCustomerPagedAsync(long customerId, BookingListRequest request, CancellationToken cancellationToken = default);
    Task<(List<BookingResponse> Items, int TotalCount)> GetByOwnerPagedAsync(long ownerId, BookingListRequest request, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetExpiredPendingAsync(DateTime threshold, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
