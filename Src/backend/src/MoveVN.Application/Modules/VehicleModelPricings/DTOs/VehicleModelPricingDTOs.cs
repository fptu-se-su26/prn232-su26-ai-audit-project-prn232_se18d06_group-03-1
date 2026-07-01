namespace MoveVN.Application.Modules.VehicleModelPricings.DTOs;

public class VehicleModelPricingResponse
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal SuggestedMinPrice { get; set; }
    public decimal SuggestedMaxPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateVehicleModelPricingRequest
{
    public int ModelId { get; set; }
    public decimal BasePrice { get; set; }
    public decimal SuggestedMinPrice { get; set; }
    public decimal SuggestedMaxPrice { get; set; }
}

public class UpdateVehicleModelPricingRequest
{
    public int ModelId { get; set; }
    public decimal BasePrice { get; set; }
    public decimal SuggestedMinPrice { get; set; }
    public decimal SuggestedMaxPrice { get; set; }
    public bool IsActive { get; set; }
}

public class RegionPriceResponse
{
    public string RegionCode { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
    public decimal Coefficient { get; set; }
    public decimal CalculatedBasePrice { get; set; }
    public decimal CalculatedMinPrice { get; set; }
    public decimal CalculatedMaxPrice { get; set; }
}
