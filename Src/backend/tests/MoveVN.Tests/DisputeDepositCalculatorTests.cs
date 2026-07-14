using FluentAssertions;
using MoveVN.Application.Modules.Disputes.Services;

namespace MoveVN.Tests;

public class DisputeDepositCalculatorTests
{
    [Fact]
    public void AvailableAmount_SubtractsPlatformFeeBeforeDisputeSettlement()
    {
        var result = DisputeDepositCalculator.GetAvailableAmount(29_400m, 14_700m, 0m);

        result.Should().Be(14_700m);
    }

    [Fact]
    public void AvailableAmount_SubtractsOnlyCompletedDisputePayouts()
    {
        var result = DisputeDepositCalculator.GetAvailableAmount(29_400m, 14_700m, 2_000m);

        result.Should().Be(12_700m);
    }

    [Fact]
    public void AvailableAmount_DoesNotTreatAZeroValueBookingEarningAsReleasedDeposit()
    {
        var result = DisputeDepositCalculator.GetAvailableAmount(29_400m, 14_700m, 0m, 0m);

        result.Should().Be(14_700m);
    }

    [Fact]
    public void AvailableAmount_ReturnsTheDepositRemainderAfterCompensation()
    {
        var result = DisputeDepositCalculator.GetAvailableAmount(29_400m, 14_700m, 7_002m);

        result.Should().Be(7_698m);
    }
}
