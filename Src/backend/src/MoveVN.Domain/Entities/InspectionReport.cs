namespace MoveVN.Domain.Entities;

public class InspectionReport
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
    public string? CustomerSignatureUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

