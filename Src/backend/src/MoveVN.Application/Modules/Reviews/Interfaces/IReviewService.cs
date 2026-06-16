using MoveVN.Application.Modules.Reviews.DTOs;

namespace MoveVN.Application.Modules.Reviews.Interfaces;

public interface IReviewService
{
    Task<ReviewResponse> CreateAsync(CreateReviewRequest request, long reviewerId, CancellationToken cancellationToken = default);
    Task<List<ReviewResponse>> GetByVehicleAsync(long vehicleId, CancellationToken cancellationToken = default);
}
