namespace MoveVN.Domain.Entities;

public class VehicleModelVariant
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public byte? SeatCount { get; set; }
    public string? Transmission { get; set; }
    public string? FuelType { get; set; }
    public string? BodyType { get; set; }
    public string? Drivetrain { get; set; }
    public string? BikeType { get; set; }
    public string? EngineCapacity { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
