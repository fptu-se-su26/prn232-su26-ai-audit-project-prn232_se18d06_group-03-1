namespace MoveVN.Application.Modules.Reviews.DTOs;

public class CreateReviewRequest
{
    public long BookingId { get; set; }
    public byte Rating { get; set; }
    public byte? CleanlinessScore { get; set; }
    public byte? AccuracyScore { get; set; }
    public byte? SupportScore { get; set; }
    public string? Comment { get; set; }
}
