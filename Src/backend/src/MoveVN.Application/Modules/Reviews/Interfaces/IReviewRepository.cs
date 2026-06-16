using MoveVN.Application.Modules.Reviews.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Reviews.Interfaces;

public interface IReviewRepository
{
    Task<bool> ExistsAsync(long bookingId, long reviewerId, CancellationToken cancellationToken = default);
    Task<Booking?> GetBookingAsync(long bookingId, CancellationToken cancellationToken = default);
    Task AddAsync(Review review, CancellationToken cancellationToken = default);
    Task<List<ReviewResponse>> GetByVehicleAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task UpdateVehicleRatingAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
