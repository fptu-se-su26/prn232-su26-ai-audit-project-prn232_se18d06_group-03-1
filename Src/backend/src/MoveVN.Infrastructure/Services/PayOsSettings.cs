namespace MoveVN.Infrastructure.Services;

public class PayOsSettings
{
    public string ClientId { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public string ChecksumKey { get; set; } = "";
    public string ReturnUrl { get; set; } = "";
    public string CancelUrl { get; set; } = "";

    // Payout (Chi tiền) - separate keys
    public string PayoutClientId { get; set; } = "";
    public string PayoutApiKey { get; set; } = "";
    public string PayoutChecksumKey { get; set; } = "";
}
