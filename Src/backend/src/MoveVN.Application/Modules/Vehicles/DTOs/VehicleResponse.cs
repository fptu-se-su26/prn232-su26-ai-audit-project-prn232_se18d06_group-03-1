namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class VehicleResponse
{
    public long Id { get; set; }
    public long OwnerId { get; set; }
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int? VariantId { get; set; }
    public string? VariantName { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public int? OdometerKm { get; set; }
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public string? FeaturedImage { get; set; }
    public List<VehicleImageResponse> Images { get; set; } = [];
    public List<VehicleFeatureResponse> Features { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class VehicleImageResponse
{
    public long Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public byte SortOrder { get; set; }
}

public class VehicleFeatureResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
