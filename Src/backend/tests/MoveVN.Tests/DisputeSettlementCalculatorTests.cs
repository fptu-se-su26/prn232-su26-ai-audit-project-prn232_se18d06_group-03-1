using FluentAssertions;
using MoveVN.Application.Modules.Disputes.Services;

namespace MoveVN.Tests;

public class DisputeSettlementCalculatorTests
{
    [Fact]
    public void CustomerPaysOwner_SplitsHeldAndExternalAmounts()
    {
        var result = DisputeSettlementCalculator.Calculate("CustomerPaysOwner", "DepositThenExternal", 100_000m, 70_000m);

        result.PlatformAmount.Should().Be(70_000m);
        result.ExternalAmount.Should().Be(30_000m);
    }

    [Fact]
    public void CustomerPaysOwner_UsesOnlyAvailableHeldAmount()
    {
        var result = DisputeSettlementCalculator.Calculate("CustomerPaysOwner", "DepositThenExternal", 50_000m, 70_000m);

        result.PlatformAmount.Should().Be(50_000m);
        result.ExternalAmount.Should().Be(0m);
    }

    [Fact]
    public void OwnerRefundsCustomer_RemainsExternal()
    {
        var result = DisputeSettlementCalculator.Calculate("OwnerRefundsCustomer", "ExternalOnly", 50_000m, 70_000m);

        result.PlatformAmount.Should().Be(0m);
        result.ExternalAmount.Should().Be(50_000m);
    }

    [Fact]
    public void CustomerPaysOwner_ExternalOnly_DoesNotUseDeposit()
    {
        var result = DisputeSettlementCalculator.Calculate("CustomerPaysOwner", "ExternalOnly", 50_000m, 70_000m);

        result.PlatformAmount.Should().Be(0m);
        result.ExternalAmount.Should().Be(50_000m);
    }
}
