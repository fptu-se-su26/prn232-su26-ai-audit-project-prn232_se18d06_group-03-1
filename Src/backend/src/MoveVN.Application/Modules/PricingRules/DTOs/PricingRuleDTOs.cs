namespace MoveVN.Application.Modules.PricingRules.DTOs;

public class PricingRuleResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int? BrandId { get; set; }
    public string? BrandName { get; set; }
    public int? ModelId { get; set; }
    public string? ModelName { get; set; }
    public int? PricingRegionId { get; set; }
    public string? PricingRegionCode { get; set; }
    public int Priority { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreatePricingRuleRequest
{
    public string Name { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int? BrandId { get; set; }
    public int? ModelId { get; set; }
    public int? PricingRegionId { get; set; }
    public int Priority { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class UpdatePricingRuleRequest
{
    public string Name { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int? BrandId { get; set; }
    public int? ModelId { get; set; }
    public int? PricingRegionId { get; set; }
    public int Priority { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
}
