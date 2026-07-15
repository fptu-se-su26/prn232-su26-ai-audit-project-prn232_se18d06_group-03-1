using MoveVN.Application.Modules.Bookings.Services;

namespace MoveVN.Tests;

public class EscrowSettlementCalculatorTests
{
    [Fact]
    public void Completion_SplitsEscrowUsingBookingFeeSnapshot()
    {
        var result = EscrowSettlementCalculator.ForCompletion(50_000m, 18_000m);

        Assert.Equal(18_000m, result.PlatformFee);
        Assert.Equal(32_000m, result.OwnerAmount);
        Assert.Equal(0m, result.RefundAmount);
    }

    [Theory]
    [InlineData(100, 50_000, 0, 0)]
    [InlineData(50, 25_000, 2_500, 22_500)]
    [InlineData(0, 0, 5_000, 45_000)]
    public void Cancellation_ChargesTenPercentOnlyOnForfeitedDeposit(
        int refundPercent,
        decimal expectedRefund,
        decimal expectedFee,
        decimal expectedOwnerAmount)
    {
        var result = EscrowSettlementCalculator.ForCancellation(50_000m, refundPercent);

        Assert.Equal(expectedRefund, result.RefundAmount);
        Assert.Equal(expectedFee, result.PlatformFee);
        Assert.Equal(expectedOwnerAmount, result.OwnerAmount);
    }
}
