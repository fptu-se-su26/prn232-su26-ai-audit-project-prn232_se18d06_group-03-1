namespace MoveVN.Application.Modules.Reviews.DTOs;

public class CreateReviewRequest
{
    public long BookingId { get; set; }
    public byte Rating { get; set; }       // 1-5
    public byte? CleanlinessScore { get; set; }
    public byte? AccuracyScore { get; set; }
    public byte? SupportScore { get; set; }
    public string? Comment { get; set; }
}

public class ReviewResponse
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
    public long RevieweeId { get; set; }
    public long? VehicleId { get; set; }
    public byte Rating { get; set; }
    public byte? CleanlinessScore { get; set; }
    public byte? AccuracyScore { get; set; }
    public byte? SupportScore { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
