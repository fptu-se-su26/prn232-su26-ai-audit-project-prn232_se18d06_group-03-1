namespace MoveVN.Domain.Entities;

public class Report
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long ReporterId { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

