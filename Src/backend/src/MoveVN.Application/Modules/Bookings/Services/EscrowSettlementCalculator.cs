namespace MoveVN.Application.Modules.Bookings.Services;

public sealed record EscrowSettlement(
    decimal RefundAmount,
    decimal PlatformFee,
    decimal OwnerAmount,
    decimal ForfeitedAmount);

public static class EscrowSettlementCalculator
{
    public const decimal CancellationFeeRate = 0.10m;

    public static EscrowSettlement ForCompletion(decimal escrowAmount, decimal bookingPlatformFee)
    {
        var escrow = Math.Max(escrowAmount, 0m);
        var fee = Math.Min(Math.Max(bookingPlatformFee, 0m), escrow);
        return new EscrowSettlement(0m, fee, escrow - fee, 0m);
    }

    public static EscrowSettlement ForCancellation(decimal escrowAmount, int refundPercent)
    {
        var escrow = Math.Max(escrowAmount, 0m);
        var percent = Math.Clamp(refundPercent, 0, 100);
        var refund = Math.Round(escrow * percent / 100m, 0);
        var forfeited = escrow - refund;
        var fee = Math.Round(forfeited * CancellationFeeRate, 0);
        return new EscrowSettlement(refund, fee, forfeited - fee, forfeited);
    }
}
