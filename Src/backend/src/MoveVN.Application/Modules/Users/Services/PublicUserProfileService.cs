using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Users.Services;

public class PublicUserProfileService : IPublicUserProfileService
{
    private readonly IUserRepository _userRepository;
    private readonly IVehicleCatalogRepository _catalogRepository;
    private readonly IBookingRepository _bookingRepository;

    public PublicUserProfileService(
        IUserRepository userRepository,
        IVehicleCatalogRepository catalogRepository,
        IBookingRepository bookingRepository)
    {
        _userRepository = userRepository;
        _catalogRepository = catalogRepository;
        _bookingRepository = bookingRepository;
    }

    public async Task<PublicUserProfileResponse> GetProfileAsync(long userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("Người dùng không tồn tại.");

        var ownerProfile = await _userRepository.GetOwnerProfileByUserIdAsync(userId, cancellationToken);

        var vehiclesQuery = _catalogRepository.Vehicles
            .Where(v => v.OwnerId == userId && v.Status == VehicleStatus.Approved);

        var totalVehicles = await vehiclesQuery.CountAsync(cancellationToken);

        var primaryImages = await _catalogRepository.VehicleImages
            .Where(img => vehiclesQuery.Any(v => v.Id == img.VehicleId) && img.IsPrimary)
            .ToDictionaryAsync(img => img.VehicleId, img => img.ImageUrl, cancellationToken);

        var vehicles = await vehiclesQuery
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new PublicProfileVehicle
            {
                Id = v.Id,
                BrandName = v.Brand.Name,
                ModelName = v.Model.Name,
                VariantName = v.Variant != null ? v.Variant.Name : null,
                VehicleType = v.VehicleType,
                Year = v.Year,
                PricePerDay = v.PricePerDay,
                Address = v.Address,
                PrimaryImage = null,
            })
            .ToListAsync(cancellationToken);

        foreach (var v in vehicles)
        {
            if (primaryImages.TryGetValue(v.Id, out var url))
                v.PrimaryImage = url;
        }

        var reviews = await _bookingRepository.GetReviewsByRevieweeIdAsync(userId, cancellationToken);

        var totalReviews = reviews.Count;
        var avgRating = reviews.Count != 0
            ? (decimal)Math.Round(reviews.Average(r => (double)r.Rating), 1)
            : (decimal?)null;

        var finalRating = ownerProfile?.AverageRating ?? avgRating;

        var reviewerIds = reviews.Select(r => r.ReviewerId).Distinct().ToList();
        var reviewers = reviewerIds.Count != 0
            ? await _userRepository.GetUsersByIdsAsync(reviewerIds, cancellationToken)
            : [];
        var reviewerMap = reviewers.ToDictionary(r => r.Id, r => r);

        return new PublicUserProfileResponse
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AvatarUrl = user.AvatarUrl,
            IsOnline = user.IsOnline,
            CreatedAt = user.CreatedAt,
            LastSeenAt = user.LastSeenAt,

            IsOwner = ownerProfile != null,
            IsVerified = ownerProfile?.IsVerified ?? false,
            Tier = ownerProfile?.Tier,
            TotalTrips = ownerProfile?.TotalTrips ?? 0,
            AverageRating = finalRating,

            TotalReviews = totalReviews,
            TotalVehicles = totalVehicles,

            Vehicles = vehicles,
            Reviews = reviews.Select(r =>
            {
                reviewerMap.TryGetValue(r.ReviewerId, out var rev);
                return new PublicProfileReview
                {
                    Id = r.Id,
                    ReviewerId = r.ReviewerId,
                    ReviewerName = rev?.FullName ?? $"Người dùng #{r.ReviewerId}",
                    ReviewerAvatar = rev?.AvatarUrl,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                };
            }).ToList(),
        };
    }
}
