namespace MoveVN.Domain.Entities;

public class CashbackRule
{
    public int Id { get; set; }
    public string TrustTier { get; set; } = string.Empty;
    public decimal CashbackPercent { get; set; }
    public decimal MinDepositReduction { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

