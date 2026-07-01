namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class CatalogBrandResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
}

public class CatalogModelResponse
{
    public int Id { get; set; }
    public int BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CatalogVariantResponse
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public byte? SeatCount { get; set; }
    public string? Transmission { get; set; }
    public string? FuelType { get; set; }
    public string? BodyType { get; set; }
    public string? BikeType { get; set; }
    public string? EngineCapacity { get; set; }
}

public class CatalogFeatureResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
}

public class CatalogAreaResponse
{
    public int Id { get; set; }
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
    public string PricingRegionCode { get; set; } = string.Empty;
}

public class CatalogPricingRegionResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}
