namespace MoveVN.Application.Modules.Disputes.Services;

public readonly record struct DisputeSettlementBreakdown(decimal PlatformAmount, decimal ExternalAmount);

public static class DisputeSettlementCalculator
{
    public static DisputeSettlementBreakdown Calculate(
        string direction,
        string settlementMethod,
        decimal decisionAmount,
        decimal availablePlatformAmount)
    {
        var normalizedDecision = Math.Max(decisionAmount, 0m);
        var normalizedAvailable = Math.Max(availablePlatformAmount, 0m);
        var platformAmount = direction == "CustomerPaysOwner" && settlementMethod == "DepositThenExternal"
            ? Math.Min(normalizedDecision, normalizedAvailable)
            : 0m;

        return new DisputeSettlementBreakdown(platformAmount, normalizedDecision - platformAmount);
    }
}
