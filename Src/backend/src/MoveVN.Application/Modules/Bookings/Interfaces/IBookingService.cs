using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Bookings.DTOs;

namespace MoveVN.Application.Modules.Bookings.Interfaces;

public interface IBookingService
{
    Task<BookingResponse> CreateAsync(CreateBookingRequest request, long customerId, CancellationToken cancellationToken = default);
    Task<BookingResponse> ApproveAsync(long bookingId, long ownerId, ApproveBookingRequest request, CancellationToken cancellationToken = default);
    Task<BookingResponse> GetByIdAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<PagedResult<BookingResponse>> GetMyBookingsAsync(long userId, BookingQueryRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<BookingResponse>> GetOwnerBookingsAsync(long vehicleId, long ownerId, BookingQueryRequest request, CancellationToken cancellationToken = default);
    Task AutoCancelExpiredAsync(CancellationToken cancellationToken = default);
}
