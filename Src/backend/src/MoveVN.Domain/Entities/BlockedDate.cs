namespace MoveVN.Domain.Entities;

public class BlockedDate
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

