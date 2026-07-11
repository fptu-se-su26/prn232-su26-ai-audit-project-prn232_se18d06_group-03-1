namespace MoveVN.Application.Modules.Reviews.DTOs;

public class ReviewResponse
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public string? ReviewerAvatar { get; set; }
    public long RevieweeId { get; set; }
    public long? VehicleId { get; set; }
    public byte Rating { get; set; }
    public byte? CleanlinessScore { get; set; }
    public byte? AccuracyScore { get; set; }
    public byte? SupportScore { get; set; }
    public string? Comment { get; set; }
    public string ReviewType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
