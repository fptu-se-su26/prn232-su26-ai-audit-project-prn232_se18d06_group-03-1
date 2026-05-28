namespace MoveVN.Domain.Entities;

public class CarDetail
{
    public long VehicleId { get; set; }
    public byte SeatCount { get; set; }
    public string Transmission { get; set; } = string.Empty;
    public string FuelType { get; set; } = string.Empty;
    public string BodyType { get; set; } = string.Empty;
    public string? Drivetrain { get; set; }
}

