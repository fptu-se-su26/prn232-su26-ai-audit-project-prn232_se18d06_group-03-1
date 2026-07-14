namespace MoveVN.Application.Modules.Disputes.Services;

public static class DisputeDepositCalculator
{
    public static decimal GetAvailableAmount(
        decimal depositAmount,
        decimal platformFee,
        decimal completedDisputePayouts,
        decimal completedDepositRefunds = 0m)
        => Math.Max(depositAmount - platformFee - completedDisputePayouts - completedDepositRefunds, 0m);
}
