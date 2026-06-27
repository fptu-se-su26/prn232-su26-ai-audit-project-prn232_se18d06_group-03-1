namespace MoveVN.Application.Modules.PricingRules.DTOs;

public class PricingRuleResponse
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int Priority { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreatePricingRuleRequest
{
    public long VehicleId { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int Priority { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class UpdatePricingRuleRequest
{
    public long VehicleId { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int Priority { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
}
