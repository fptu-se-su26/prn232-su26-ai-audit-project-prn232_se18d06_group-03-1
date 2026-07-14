namespace MoveVN.Application.Modules.Disputes.Services;

public static class DisputeDepositCalculator
{
    public static decimal GetAvailableAmount(
        decimal depositAmount,
        decimal platformFee,
        decimal completedDisputePayouts,
        decimal completedBookingEarning = 0m)
        => Math.Max(depositAmount - platformFee - completedDisputePayouts - completedBookingEarning, 0m);
}
