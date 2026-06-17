namespace MoveVN.Domain.Entities;

public class TrustScoreHistory
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public decimal Score { get; set; }
    public string Tier { get; set; } = string.Empty;
    public int CompletedTrips { get; set; }
    public int CancellationCount { get; set; }
    public int ReportCount { get; set; }
    public decimal? AverageRating { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
