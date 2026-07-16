using FluentAssertions;
using MoveVN.Application.Modules.Bookings.Services;

namespace MoveVN.Tests;

public class BookingCancellationPolicyTests
{
    private static readonly DateTime PickupAt = new(2026, 8, 20, 8, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void CancelAtLeastSevenDaysBeforePickup_RefundsAllDeposit()
    {
        var result = BookingCancellationPolicy.Calculate(500_000m, PickupAt, PickupAt.AddDays(-7));

        result.RefundPercent.Should().Be(100);
        result.RefundAmount.Should().Be(500_000m);
        result.ForfeitedAmount.Should().Be(0m);
    }

    [Theory]
    [InlineData(7, 100)]
    [InlineData(6, 50)]
    [InlineData(3, 50)]
    [InlineData(2, 0)]
    [InlineData(0, 0)]
    public void RefundTier_IsChosenFromTimeBeforePickup(int daysBeforePickup, int expectedPercent)
    {
        var result = BookingCancellationPolicy.Calculate(400_000m, PickupAt, PickupAt.AddDays(-daysBeforePickup));

        result.RefundPercent.Should().Be(expectedPercent);
    }

    [Fact]
    public void FiftyPercentTier_SplitsRefundAndForfeitureEqually()
    {
        var result = BookingCancellationPolicy.Calculate(501_000m, PickupAt, PickupAt.AddDays(-4));

        result.RefundAmount.Should().Be(250_500m);
        result.ForfeitedAmount.Should().Be(250_500m);
    }
}
