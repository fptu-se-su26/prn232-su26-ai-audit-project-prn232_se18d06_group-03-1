namespace MoveVN.Domain.Entities;

public class SupportTicket
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";
    public long? AssignedStaffId { get; set; }
    public string Priority { get; set; } = "Normal";
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

