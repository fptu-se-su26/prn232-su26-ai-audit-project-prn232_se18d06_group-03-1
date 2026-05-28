namespace MoveVN.Domain.Entities;

public class WalletTransaction
{
    public long Id { get; set; }
    public long WalletId { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public long? ReferenceId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

