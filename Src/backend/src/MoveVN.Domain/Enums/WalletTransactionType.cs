namespace MoveVN.Domain.Enums;

public static class WalletTransactionType
{
    // Money IN
    public const string TopUp = "TopUp";
    public const string BookingEarning = "BookingEarning";
    public const string Refund = "Refund";
    public const string PayoutReversal = "PayoutReversal";
    public const string AdminAdjust = "AdminAdjust";

    // Money OUT
    public const string BookingPayment = "BookingPayment";
    public const string Withdrawal = "Withdrawal";
    public const string Penalty = "Penalty";
    public const string PlatformFee = "PlatformFee";
}
