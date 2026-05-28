namespace MoveVN.Domain.Entities;

public class Review
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long ReviewerId { get; set; }
    public long RevieweeId { get; set; }
    public long? VehicleId { get; set; }
    public byte Rating { get; set; }
    public byte? CleanlinessScore { get; set; }
    public byte? AccuracyScore { get; set; }
    public byte? SupportScore { get; set; }
    public string? Comment { get; set; }
    public bool IsPublic { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

