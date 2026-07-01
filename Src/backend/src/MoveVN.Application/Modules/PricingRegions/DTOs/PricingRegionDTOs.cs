namespace MoveVN.Application.Modules.PricingRegions.DTOs;

public class PricingRegionResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Coefficient { get; set; }
    public bool IsActive { get; set; }
}

public class CreatePricingRegionRequest
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Coefficient { get; set; } = 1.00m;
}

public class UpdatePricingRegionRequest
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Coefficient { get; set; } = 1.00m;
    public bool IsActive { get; set; }
}
