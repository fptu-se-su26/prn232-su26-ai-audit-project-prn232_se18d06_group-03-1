using FluentAssertions;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Services;

namespace MoveVN.Tests;

public class BookingRiskScorerTests
{
    private readonly RuleBasedBookingRiskScorer _scorer = new();

    [Fact]
    public void Calculate_NewVerifiedCustomerWithNormalBooking_ReturnsLowRisk()
    {
        var context = CreateContext(
            customerCreatedAt: DateTime.UtcNow.AddHours(-12),
            isEmailVerified: true,
            isNationalIdVerified: true,
            isDriverLicenseVerified: true,
            trustScore: null,
            completedTrips: 0,
            depositAmount: 500_000m);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(25m);
        result.Level.Should().Be("Low");
    }

    [Fact]
    public void Calculate_NewUnverifiedCustomerWithNormalBooking_ReturnsHighRisk()
    {
        var context = CreateContext(
            customerCreatedAt: DateTime.UtcNow.AddHours(-12),
            isEmailVerified: false,
            isNationalIdVerified: false,
            isDriverLicenseVerified: false,
            trustScore: null,
            completedTrips: 0);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(65m);
        result.Level.Should().Be("High");
    }

    [Fact]
    public void Calculate_NewUnverifiedUrgentHighValueMissingDeposit_ReturnsMaxHighRisk()
    {
        var bookingCreatedAt = DateTime.UtcNow;
        var context = CreateContext(
            customerCreatedAt: bookingCreatedAt.AddHours(-12),
            isEmailVerified: false,
            isNationalIdVerified: false,
            isDriverLicenseVerified: false,
            trustScore: null,
            completedTrips: 0,
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
    public void Calculate_GoodReturningCustomer_ReturnsLowRisk()
    {
        var context = CreateContext(
            customerCreatedAt: DateTime.UtcNow.AddYears(-1),
            isEmailVerified: true,
            isNationalIdVerified: true,
            isDriverLicenseVerified: true,
            trustScore: 85m,
            completedTrips: 10,
            averageRating: 4.8m,
            depositAmount: 500_000m);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(0m);
        result.Level.Should().Be("Low");
    }

    [Fact]
    public void Calculate_ReturningCustomerWithReportsAndGoodHistory_DoesNotOverPenalize()
    {
        var context = CreateContext(
            customerCreatedAt: DateTime.UtcNow.AddYears(-1),
            isEmailVerified: true,
            isNationalIdVerified: true,
            isDriverLicenseVerified: true,
            trustScore: 85m,
            completedTrips: 10,
            cancellationCount: 1,
            reportCount: 2,
            averageRating: 4.8m,
            depositAmount: 500_000m);

        var result = _scorer.Calculate(context);

        result.Score.Should().Be(16m);
        result.Level.Should().Be("Low");
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
            averageRating: 4.2m,
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
