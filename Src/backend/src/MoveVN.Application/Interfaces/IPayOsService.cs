namespace MoveVN.Application.Interfaces;

public interface IPayOsService
{
    /// <summary>
    /// Creates a PayOS payment link for collecting money from customer.
    /// </summary>
    Task<PaymentLinkResult> CreatePaymentLinkAsync(CreatePaymentLinkInput input);

    /// <summary>
    /// Gets current status of a payment link from PayOS.
    /// </summary>
    Task<PaymentLinkInfo> GetPaymentLinkInfoAsync(long orderCode);

    /// <summary>
    /// Cancels an active payment link on PayOS.
    /// </summary>
    Task CancelPaymentLinkAsync(long orderCode, string reason);

    /// <summary>
    /// Creates a payout (transfer money to bank account) via PayOS.
    /// </summary>
    Task<PayoutResult> CreatePayoutAsync(CreatePayoutInput input);

    /// <summary>
    /// Gets payout status from PayOS.
    /// </summary>
    Task<PayoutInfo> GetPayoutInfoAsync(string payoutId);

    /// <summary>
    /// Gets the current payout account balance from PayOS.
    /// </summary>
    Task<decimal> GetPayoutBalanceAsync();

    /// <summary>
    /// Verifies that a webhook payload signature is authentic from PayOS.
    /// </summary>
    bool VerifyWebhookSignature(string rawBody, string signature);
}

// --- DTOs ---

public record CreatePaymentLinkInput
{
    public long OrderCode { get; init; }
    public int Amount { get; init; }
    public string Description { get; init; } = "";
    public string? BuyerName { get; init; }
    public string? BuyerEmail { get; init; }
    public string? BuyerPhone { get; init; }
    public List<PaymentItemInput>? Items { get; init; }
    public int? ExpireAfterMinutes { get; init; } = 30;
    public string? ReturnUrl { get; init; }
    public string? CancelUrl { get; init; }
}

public record PaymentItemInput(string Name, int Quantity, int Price);

public record PaymentLinkResult
{
    public string CheckoutUrl { get; init; } = "";
    public string QrCode { get; init; } = "";
    public string PaymentLinkId { get; init; } = "";
    public long OrderCode { get; init; }
}

public record PaymentLinkInfo
{
    public long OrderCode { get; init; }
    public int Amount { get; init; }
    public int AmountPaid { get; init; }
    public string Status { get; init; } = "";
}

public record CreatePayoutInput
{
    public string ReferenceId { get; init; } = "";
    public int Amount { get; init; }
    public string Description { get; init; } = "";
    public string ToBin { get; init; } = "";
    public string ToAccountNumber { get; init; } = "";
}

public record PayoutResult
{
    public string PayoutId { get; init; } = "";
    public string ReferenceId { get; init; } = "";
    public string State { get; init; } = "";
}

public record PayoutInfo
{
    public string PayoutId { get; init; } = "";
    public string State { get; init; } = "";
    public int Amount { get; init; }
}
