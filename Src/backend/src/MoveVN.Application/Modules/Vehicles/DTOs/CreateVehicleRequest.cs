namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class CreateVehicleRequest
{
    public int BrandId { get; set; }
    public int ModelId { get; set; }
    public int? VariantId { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public int? OdometerKm { get; set; }
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public int? AreaId { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal PricePerDay { get; set; }
    public int DepositPercent { get; set; }
    public string? PricingMode { get; set; }
    public decimal? FixedPricePerDay { get; set; }
    public decimal? AutoMinPrice { get; set; }
    public decimal? AutoMaxPrice { get; set; }
    public List<int> FeatureIds { get; set; } = [];
    public List<string> ImageUrls { get; set; } = [];
    public int? FeaturedImageIndex { get; set; }
    public string? DocumentFileUrl { get; set; }
}
