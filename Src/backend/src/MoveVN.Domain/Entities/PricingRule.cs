namespace MoveVN.Domain.Entities;

public class PricingRule
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int? BrandId { get; set; }
    public VehicleBrand? Brand { get; set; }
    public int? ModelId { get; set; }
    public VehicleModel? Model { get; set; }
    public int? PricingRegionId { get; set; }
    public PricingRegion? PricingRegion { get; set; }
    public int Priority { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}

