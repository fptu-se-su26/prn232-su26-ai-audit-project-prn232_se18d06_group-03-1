using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Reviews.DTOs;
using MoveVN.Application.Modules.Reviews.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Reviews.Services;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _repo;

    public ReviewService(IReviewRepository repo)
    {
        _repo = repo;
    }

    public async Task<ReviewResponse> CreateAsync(CreateReviewRequest request, long reviewerId, CancellationToken cancellationToken = default)
    {
        // 1 review per booking per reviewer
        var alreadyReviewed = await _repo.ExistsAsync(request.BookingId, reviewerId, cancellationToken);
        if (alreadyReviewed)
            throw new ValidationException(new[] { "Bạn đã đánh giá booking này rồi." });

        var booking = await _repo.GetBookingAsync(request.BookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.Status != "Completed")
            throw new ValidationException(new[] { "Chỉ đánh giá được sau khi hoàn thành chuyến." });

        // Determine reviewee: if reviewer is customer → reviewee is owner, vice versa
        var revieweeId = booking.CustomerId == reviewerId ? booking.OwnerId : booking.CustomerId;

        var review = new Review
        {
            BookingId = request.BookingId,
            ReviewerId = reviewerId,
            RevieweeId = revieweeId,
            VehicleId = booking.VehicleId,
            Rating = request.Rating,
            CleanlinessScore = request.CleanlinessScore,
            AccuracyScore = request.AccuracyScore,
            SupportScore = request.SupportScore,
            Comment = request.Comment,
            IsPublic = true
        };

        await _repo.AddAsync(review, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        // Update vehicle average rating
        await _repo.UpdateVehicleRatingAsync(booking.VehicleId, cancellationToken);

        return new ReviewResponse
        {
            Id = review.Id,
            BookingId = review.BookingId,
            ReviewerId = review.ReviewerId,
            RevieweeId = review.RevieweeId,
            VehicleId = review.VehicleId,
            Rating = review.Rating,
            CleanlinessScore = review.CleanlinessScore,
            AccuracyScore = review.AccuracyScore,
            SupportScore = review.SupportScore,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }

    public async Task<List<ReviewResponse>> GetByVehicleAsync(long vehicleId, CancellationToken cancellationToken = default)
    {
        return await _repo.GetByVehicleAsync(vehicleId, cancellationToken);
    }
}
