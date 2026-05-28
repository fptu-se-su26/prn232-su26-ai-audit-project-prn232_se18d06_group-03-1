namespace MoveVN.Domain.Entities;

public class TrustScore
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public decimal Score { get; set; }
    public string Tier { get; set; } = "New";
    public int CompletedTrips { get; set; }
    public int CancellationCount { get; set; }
    public int ReportCount { get; set; }
    public decimal? AverageRating { get; set; }
    public DateTime LastCalculatedAt { get; set; } = DateTime.UtcNow;
}

