namespace MoveVN.Domain.Entities;

public class PricingRule
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int Priority { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}

