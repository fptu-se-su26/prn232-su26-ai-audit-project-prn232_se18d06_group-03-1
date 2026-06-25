namespace MoveVN.Application.Modules.VehicleModelVariants.DTOs;

public class VehicleModelVariantResponse
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public byte? SeatCount { get; set; }
    public string? Transmission { get; set; }
    public string? FuelType { get; set; }
    public string? BodyType { get; set; }
    public string? Drivetrain { get; set; }
    public string? BikeType { get; set; }
    public string? EngineCapacity { get; set; }
    public int? RequiredLicenseClassId { get; set; }
    public string? RequiredLicenseClassCode { get; set; }
    public string? RequiredLicenseClassDisplayName { get; set; }
    public string? RequiredLicenseClassSystemVersion { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
