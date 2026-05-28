namespace MoveVN.Domain.Entities;

public class BookingStatusHistory
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = string.Empty;
    public long? ChangedBy { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

