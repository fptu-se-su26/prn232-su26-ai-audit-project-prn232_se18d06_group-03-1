namespace MoveVN.Application.Modules.Reports.DTOs;

public class CreateDisputeRequest
{
    public long BookingId { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> EvidenceUrls { get; set; } = new();
}

public class ResolveDisputeRequest
{
    public string Resolution { get; set; } = string.Empty;
    public decimal? CompensationAmount { get; set; }
    public bool Escalate { get; set; }
}

public class DisputeResponse
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long OpenedBy { get; set; }
    public long? AssignedStaffId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public decimal? CompensationAmount { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SupportTicketDto
{
    public long Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateTicketRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Content { get; set; } = string.Empty;
    public long? BookingId { get; set; }
}

public class TicketMessageDto
{
    public long Id { get; set; }
    public long SenderId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SendTicketMessageRequest
{
    public string Message { get; set; } = string.Empty;
}
