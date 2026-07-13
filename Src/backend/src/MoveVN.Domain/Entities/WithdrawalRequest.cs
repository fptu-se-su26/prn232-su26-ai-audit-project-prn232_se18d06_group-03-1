namespace MoveVN.Domain.Entities;

public class WithdrawalRequest
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long WalletTransactionId { get; set; }
    public decimal Amount { get; set; }
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BankAccountHolderName { get; set; } = string.Empty;
    public string? BankBin { get; set; }
    public string Status { get; set; } = "Pending"; // Pending → Approved → Completed | Rejected
    public long? ProcessedBy { get; set; }
    public string? ProcessNote { get; set; }
    public string? ExternalTransactionRef { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
