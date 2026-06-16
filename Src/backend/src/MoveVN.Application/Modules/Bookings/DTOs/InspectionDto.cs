namespace MoveVN.Application.Modules.Bookings.DTOs;

public class CreateInspectionRequest
{
    public long BookingId { get; set; }

    /// <summary>CheckIn | CheckOut</summary>
    public string Type { get; set; } = "CheckIn";
    public int? OdometerKm { get; set; }
    public string? FuelLevel { get; set; }
    public bool DamageNoted { get; set; }
    public string? DamageDescription { get; set; }
}

public class InspectionResponse
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public string Type { get; set; } = string.Empty;
    public long StaffId { get; set; }
    public int? OdometerKm { get; set; }
    public string? FuelLevel { get; set; }
    public bool DamageNoted { get; set; }
    public string? DamageDescription { get; set; }
    public string? ReportPdfUrl { get; set; }
    public List<string> Images { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
