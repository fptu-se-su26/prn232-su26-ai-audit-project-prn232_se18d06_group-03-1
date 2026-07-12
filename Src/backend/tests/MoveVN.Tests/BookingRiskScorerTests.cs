using FluentAssertions;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Services;

namespace MoveVN.Tests;

public class BookingRiskScorerTests
{
    private readonly RuleBasedBookingRiskScorer _scorer = new();

    [Fact]
    public void Calculate_VerifiedNewCustomerWithoutTrustOrOwnerReviews_ReturnsLowRiskWithNeutralNotes()
    {
        var bookingCreatedAt = DateTime.UtcNow;
        var context = CreateContext(
            customerCreatedAt: bookingCreatedAt.AddHours(-12),
            isEmailVerified: true,
            isNationalIdVerified: true,
            isDriverLicenseVerified: true,
            trustScore: null,
            completedTrips: 0,
            bookingCreatedAt: bookingCreatedAt,
            depositAmount: 500_000m);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(13m);
        result.Level.Should().Be("Low");
        result.Factors.Should().Contain("Chưa đủ dữ liệu trust score");
        result.Factors.Should().Contain("Chưa đủ dữ liệu đánh giá từ chủ xe sau chuyến hoàn tất");
    }

    [Fact]
    public void Calculate_CustomerWithThreePositiveOwnerReviews_ReducesRisk()
    {
        var context = CreateContext(
            customerCreatedAt: DateTime.UtcNow.AddYears(-1),
            isEmailVerified: true,
            isNationalIdVerified: true,
            isDriverLicenseVerified: true,
            trustScore: 70m,
            completedTrips: 3,
            ownerReviewCount: 3,
            ownerAverageRating: 4.7m,
            depositAmount: 500_000m);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(0m);
        result.Level.Should().Be("Low");
        result.Factors.Should().Contain("Khách có 3 đánh giá tốt từ chủ xe");
    }

    [Fact]
    public void Calculate_CustomerWithLowOwnerReviews_ReturnsMediumRisk()
    {
        var context = CreateContext(
            customerCreatedAt: DateTime.UtcNow.AddMonths(-6),
            isEmailVerified: true,
            isNationalIdVerified: true,
            isDriverLicenseVerified: true,
            trustScore: 65m,
            completedTrips: 2,
            ownerReviewCount: 3,
            ownerAverageRating: 2.8m,
            ownerLowRatingCount: 2,
            ownerRecentLowRatingCount90Days: 1);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(33m);
        result.Level.Should().Be("Medium");
        result.Factors.Should().Contain("Có 2 đánh giá thấp từ chủ xe");
    }

    [Fact]
    public void Calculate_ManyActiveRecentBookingsWithGoodOwnerReviews_DoesNotExceedMedium()
    {
        var context = CreateContext(
            customerCreatedAt: DateTime.UtcNow.AddYears(-1),
            isEmailVerified: true,
            isNationalIdVerified: true,
            isDriverLicenseVerified: true,
            trustScore: 70m,
            completedTrips: 2,
            ownerReviewCount: 3,
            ownerAverageRating: 4.8m,
            activeBookingCount: 5,
            recentBookingCount7Days: 5);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(25m);
        result.Level.Should().Be("Low");
        result.Factors.Should().Contain("Khách có 5 booking đang hoạt động");
        result.Factors.Should().Contain("Khách tạo 5 booking trong 7 ngày gần đây");
    }

    [Fact]
    public void Calculate_UnverifiedLowReviewedUrgentHighValueBooking_ReturnsHighRisk()
    {
        var bookingCreatedAt = DateTime.UtcNow;
        var context = CreateContext(
            customerCreatedAt: bookingCreatedAt.AddHours(-12),
            isEmailVerified: false,
            isNationalIdVerified: false,
            isDriverLicenseVerified: false,
            trustScore: 45m,
            completedTrips: 0,
            ownerReviewCount: 2,
            ownerAverageRating: 2.5m,
            ownerLowRatingCount: 2,
            ownerRecentLowRatingCount90Days: 1,
            bookingCreatedAt: bookingCreatedAt,
            startDate: bookingCreatedAt.AddHours(6),
            totalDays: 7,
            totalAmount: 10_000_000m,
            depositAmount: 0m,
            vehicleRequiresDeposit: true);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(100m);
        result.Level.Should().Be("High");
    }

    [Fact]
    public void Calculate_NormalCustomerWithUrgentHighValueBooking_ReturnsMediumRisk()
    {
        var bookingCreatedAt = DateTime.UtcNow;
        var context = CreateContext(
            customerCreatedAt: bookingCreatedAt.AddYears(-1),
            isEmailVerified: true,
            isNationalIdVerified: true,
            isDriverLicenseVerified: true,
            trustScore: 65m,
            completedTrips: 1,
            bookingCreatedAt: bookingCreatedAt,
            startDate: bookingCreatedAt.AddHours(6),
            totalDays: 7,
            totalAmount: 10_000_000m,
            depositAmount: 500_000m);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(37m);
        result.Level.Should().Be("Medium");
    }

    private static BookingRiskContext CreateContext(
        DateTime customerCreatedAt,
        bool isEmailVerified,
        bool isNationalIdVerified,
        bool isDriverLicenseVerified,
        decimal? trustScore,
        int completedTrips,
        int cancellationCount = 0,
        int reportCount = 0,
        decimal? averageRating = null,
        int ownerReviewCount = 0,
        decimal? ownerAverageRating = null,
        int ownerLowRatingCount = 0,
        int ownerRecentLowRatingCount90Days = 0,
        int activeBookingCount = 0,
        int recentBookingCount7Days = 0,
        DateTime? bookingCreatedAt = null,
        DateTime? startDate = null,
        int totalDays = 1,
        decimal totalAmount = 1_000_000m,
        decimal depositAmount = 0m,
        bool vehicleRequiresDeposit = false)
    {
        var createdAt = bookingCreatedAt ?? DateTime.UtcNow;

        return new BookingRiskContext
        {
            CustomerId = 1,
            CustomerCreatedAt = customerCreatedAt,
            IsEmailVerified = isEmailVerified,
            IsNationalIdVerified = isNationalIdVerified,
            IsDriverLicenseVerified = isDriverLicenseVerified,
            TrustScore = trustScore,
            CompletedTrips = completedTrips,
            CancellationCount = cancellationCount,
            ReportCount = reportCount,
            AverageRating = averageRating,
            OwnerReviewCount = ownerReviewCount,
            OwnerAverageRating = ownerAverageRating,
            OwnerLowRatingCount = ownerLowRatingCount,
            OwnerRecentLowRatingCount90Days = ownerRecentLowRatingCount90Days,
            ActiveBookingCount = activeBookingCount,
            RecentBookingCount7Days = recentBookingCount7Days,
            BookingCreatedAt = createdAt,
            StartDate = startDate ?? createdAt.AddDays(5),
            TotalDays = totalDays,
            TotalAmount = totalAmount,
            DepositAmount = depositAmount,
            VehicleRequiresDeposit = vehicleRequiresDeposit,
        };
    }
}
