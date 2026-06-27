namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class VehicleListItemResponse
{
    public long Id { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? FeaturedImage { get; set; }
    public DateTime CreatedAt { get; set; }
}
