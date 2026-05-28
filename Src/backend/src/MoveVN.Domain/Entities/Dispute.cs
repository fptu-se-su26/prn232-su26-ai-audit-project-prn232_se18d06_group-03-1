namespace MoveVN.Domain.Entities;

public class Dispute
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long? ReportId { get; set; }
    public long OpenedBy { get; set; }
    public long? AssignedStaffId { get; set; }
    public string Status { get; set; } = "Open";
    public string? Resolution { get; set; }
    public decimal? CompensationAmount { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

