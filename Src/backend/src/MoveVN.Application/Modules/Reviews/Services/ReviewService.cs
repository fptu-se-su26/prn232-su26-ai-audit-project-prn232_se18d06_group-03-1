using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Reviews.DTOs;
using MoveVN.Application.Modules.Reviews.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Reviews.Services;

public class ReviewService : IReviewService
{
    private readonly IBookingRepository _repo;
    private readonly IUserRepository _userRepo;

    public ReviewService(IBookingRepository repo, IUserRepository userRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
    }

    public async Task<ReviewResponse> CreateCustomerReviewAsync(long bookingId, long customerId, CreateReviewRequest request, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(new[] { "Bạn không có quyền đánh giá booking này." });

        if (booking.Status != "Completed")
            throw new ValidationException(new[] { "Chỉ có thể đánh giá sau khi chuyến đi hoàn thành." });

        if (request.Rating < 1 || request.Rating > 5)
            throw new ValidationException(new[] { "Điểm đánh giá phải từ 1 đến 5." });

        var alreadyReviewed = await _repo.HasReviewAsync(bookingId, customerId, cancellationToken);
        if (alreadyReviewed)
            throw new ValidationException(new[] { "Bạn đã đánh giá booking này rồi." });

        var review = new Review
        {
            BookingId = bookingId,
            ReviewerId = customerId,
            RevieweeId = booking.OwnerId,
            VehicleId = booking.VehicleId,
            Rating = request.Rating,
            CleanlinessScore = request.CleanlinessScore,
            AccuracyScore = request.AccuracyScore,
            SupportScore = request.SupportScore,
            Comment = request.Comment,
            IsPublic = true,
            CreatedAt = DateTime.UtcNow,
        };

        await _repo.AddReviewAsync(review, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        return await MapAsync(review, "Customer", cancellationToken);
    }

    public async Task<ReviewResponse> CreateOwnerReviewAsync(long bookingId, long ownerId, CreateReviewRequest request, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền đánh giá booking này." });

        if (booking.Status != "Completed")
            throw new ValidationException(new[] { "Chỉ có thể đánh giá sau khi chuyến đi hoàn thành." });

        if (request.Rating < 1 || request.Rating > 5)
            throw new ValidationException(new[] { "Điểm đánh giá phải từ 1 đến 5." });

        var alreadyReviewed = await _repo.HasReviewAsync(bookingId, ownerId, cancellationToken);
        if (alreadyReviewed)
            throw new ValidationException(new[] { "Bạn đã đánh giá booking này rồi." });

        var review = new Review
        {
            BookingId = bookingId,
            ReviewerId = ownerId,
            RevieweeId = booking.CustomerId,
            VehicleId = null,
            Rating = request.Rating,
            Comment = request.Comment,
            IsPublic = true,
            CreatedAt = DateTime.UtcNow,
        };

        await _repo.AddReviewAsync(review, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        return await MapAsync(review, "Owner", cancellationToken);
    }

    public async Task<List<ReviewResponse>> GetBookingReviewsAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        var reviews = await _repo.GetReviewsByBookingIdAsync(bookingId, cancellationToken);
        var results = new List<ReviewResponse>();
        foreach (var review in reviews)
        {
            var booking = await _repo.GetByIdAsync(review.BookingId, cancellationToken);
            var type = booking?.CustomerId == review.ReviewerId ? "Customer" : "Owner";
            results.Add(await MapAsync(review, type, cancellationToken));
        }
        return results;
    }

    public async Task<List<ReviewResponse>> GetVehicleReviewsAsync(long vehicleId, CancellationToken cancellationToken = default)
    {
        var reviews = await _repo.GetReviewsByVehicleIdAsync(vehicleId, cancellationToken);
        var results = new List<ReviewResponse>();
        foreach (var review in reviews)
        {
            results.Add(await MapAsync(review, "Customer", cancellationToken));
        }
        return results;
    }

    public async Task<bool> HasReviewedAsync(long bookingId, long userId, CancellationToken cancellationToken = default)
        => await _repo.HasReviewAsync(bookingId, userId, cancellationToken);

    private async Task<ReviewResponse> MapAsync(Review r, string reviewType, CancellationToken cancellationToken)
    {
        var reviewer = await _userRepo.GetByIdAsync(r.ReviewerId, cancellationToken);
        return new ReviewResponse
        {
            Id = r.Id,
            BookingId = r.BookingId,
            ReviewerId = r.ReviewerId,
            ReviewerName = reviewer?.FullName ?? "Người dùng",
            ReviewerAvatar = reviewer?.AvatarUrl,
            RevieweeId = r.RevieweeId,
            VehicleId = r.VehicleId,
            Rating = r.Rating,
            CleanlinessScore = r.CleanlinessScore,
            AccuracyScore = r.AccuracyScore,
            SupportScore = r.SupportScore,
            Comment = r.Comment,
            ReviewType = reviewType,
            CreatedAt = r.CreatedAt,
        };
    }
}
