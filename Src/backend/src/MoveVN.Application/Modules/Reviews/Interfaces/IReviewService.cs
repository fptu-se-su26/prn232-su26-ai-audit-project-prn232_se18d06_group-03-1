using MoveVN.Application.Modules.Reviews.DTOs;

namespace MoveVN.Application.Modules.Reviews.Interfaces;

public interface IReviewService
{
    Task<ReviewResponse> CreateCustomerReviewAsync(long bookingId, long customerId, CreateReviewRequest request, CancellationToken cancellationToken = default);
    Task<ReviewResponse> CreateOwnerReviewAsync(long bookingId, long ownerId, CreateReviewRequest request, CancellationToken cancellationToken = default);
    Task<List<ReviewResponse>> GetBookingReviewsAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<List<ReviewResponse>> GetVehicleReviewsAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<bool> HasReviewedAsync(long bookingId, long userId, CancellationToken cancellationToken = default);
}
