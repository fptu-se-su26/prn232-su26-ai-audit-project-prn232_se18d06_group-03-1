namespace MoveVN.Domain.Entities;

public class TicketMessage
{
    public long Id { get; set; }
    public long TicketId { get; set; }
    public long SenderId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrls { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

