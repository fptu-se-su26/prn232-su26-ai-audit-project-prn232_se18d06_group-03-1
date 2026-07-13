using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Repositories.Bookings;

namespace MoveVN.Tests;

public class BookingRepositoryReviewStatsTests
{
    [Fact]
    public async Task GetOwnerReviewStatsForCustomerAsync_CountsOnlyOwnerReviewsForThatCustomer()
    {
        await using var context = CreateContext();
        var now = DateTime.UtcNow;
        context.Bookings.AddRange(
            CreateBooking(1, customerId: 10, ownerId: 20),
            CreateBooking(2, customerId: 11, ownerId: 20),
            CreateBooking(3, customerId: 10, ownerId: 30),
            CreateBooking(4, customerId: 10, ownerId: 40));
        context.Reviews.AddRange(
            CreateReview(1, bookingId: 1, reviewerId: 20, revieweeId: 10, rating: 5, createdAt: now),
            CreateReview(2, bookingId: 1, reviewerId: 10, revieweeId: 20, rating: 1, createdAt: now),
            CreateReview(3, bookingId: 1, reviewerId: 21, revieweeId: 10, rating: 1, createdAt: now),
            CreateReview(4, bookingId: 2, reviewerId: 20, revieweeId: 10, rating: 1, createdAt: now),
            CreateReview(5, bookingId: 3, reviewerId: 30, revieweeId: 10, rating: 2, createdAt: now.AddDays(-10)),
            CreateReview(6, bookingId: 4, reviewerId: 40, revieweeId: 10, rating: 2, createdAt: now.AddDays(-120)));
        await context.SaveChangesAsync();

        var repository = new BookingRepository(context);

        var stats = await repository.GetOwnerReviewStatsForCustomerAsync(10);

        stats.OwnerReviewCount.Should().Be(3);
        stats.OwnerAverageRating.Should().BeApproximately(3m, 0.001m);
        stats.OwnerLowRatingCount.Should().Be(2);
        stats.OwnerRecentLowRatingCount90Days.Should().Be(1);
    }

    [Fact]
    public async Task InspectionReportMethods_SaveAndReadCheckInReportWithImages()
    {
        await using var context = CreateContext();
        context.Bookings.Add(CreateBooking(10, customerId: 100, ownerId: 200));
        await context.SaveChangesAsync();
        var repository = new BookingRepository(context);

        var report = new InspectionReport
        {
            BookingId = 10,
            Type = "CheckIn",
            StaffId = 300,
            OdometerKm = 12000,
            FuelLevel = "75%",
            DamageNoted = true,
            DamageDescription = "Scratch on rear bumper",
            CreatedAt = DateTime.UtcNow,
        };

        await repository.AddInspectionReportAsync(report);
        await repository.SaveChangesAsync();
        await repository.AddCheckInOutImageAsync(new CheckInOutImage
        {
            BookingId = 10,
            InspectionId = report.Id,
            ImageUrl = "https://example.com/before.jpg",
            ImageType = "Before",
            UploadedBy = 300,
        });
        await repository.SaveChangesAsync();

        var exists = await repository.HasInspectionReportAsync(10, "CheckIn");
        var reports = await repository.GetInspectionReportsAsync(10);
        var images = await repository.GetCheckInOutImagesAsync(10);

        exists.Should().BeTrue();
        reports.Should().ContainSingle();
        reports[0].OdometerKm.Should().Be(12000);
        images.Should().ContainSingle();
        images[0].InspectionId.Should().Be(report.Id);
        images[0].ImageType.Should().Be("Before");
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Booking CreateBooking(long id, long customerId, long ownerId)
        => new()
        {
            Id = id,
            BookingCode = $"BK{id}",
            CustomerId = customerId,
            OwnerId = ownerId,
            VehicleId = id,
            StartDate = DateTime.UtcNow.AddDays(-2),
            EndDate = DateTime.UtcNow.AddDays(-1),
            TotalDays = 1,
            PickupAddress = "HCM",
            ReturnAddress = "HCM",
            Status = "Completed",
        };

    private static Review CreateReview(long id, long bookingId, long reviewerId, long revieweeId, byte rating, DateTime createdAt)
        => new()
        {
            Id = id,
            BookingId = bookingId,
            ReviewerId = reviewerId,
            RevieweeId = revieweeId,
            Rating = rating,
            CreatedAt = createdAt,
        };
}
