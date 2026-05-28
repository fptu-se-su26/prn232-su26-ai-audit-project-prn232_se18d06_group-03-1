namespace MoveVN.Domain.Entities;

public class MLPredictionLog
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public string ModelVersion { get; set; } = string.Empty;
    public decimal RiskScore { get; set; }
    public string FeatureSnapshot { get; set; } = string.Empty;
    public string? TopRiskFactors { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

