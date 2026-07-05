using MoveVN.Application.Modules.Bookings.DTOs;

namespace MoveVN.Application.Modules.Bookings.Interfaces;

public interface IBookingService
{
    Task<BookingResponse> CreateAsync(CreateBookingRequest request, long customerId, CancellationToken cancellationToken = default);
    Task<BookingResponse> GetByIdAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<(List<BookingResponse> Items, int TotalCount)> GetMyBookingsAsync(long userId, BookingListRequest request, CancellationToken cancellationToken = default);
    Task<(List<BookingResponse> Items, int TotalCount)> GetOwnerBookingsAsync(long ownerId, BookingListRequest request, CancellationToken cancellationToken = default);
    Task<BookingResponse> ApproveAsync(long bookingId, long ownerId, CancellationToken cancellationToken = default);
    Task<BookingResponse> RejectAsync(long bookingId, long ownerId, RejectBookingRequest request, CancellationToken cancellationToken = default);
}
