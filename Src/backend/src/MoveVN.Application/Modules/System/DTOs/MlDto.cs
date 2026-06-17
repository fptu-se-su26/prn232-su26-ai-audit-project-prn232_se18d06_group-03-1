namespace MoveVN.Application.Modules.System.DTOs;

public class RiskPredictionRequest
{
    public long BookingId { get; set; }
    public long UserId { get; set; }
    public decimal? TrustScore { get; set; }
    public int CancelCount { get; set; }
    public int DurationDays { get; set; }
    public decimal VehicleValue { get; set; }
}

public class RiskPredictionDto
{
    public long BookingId { get; set; }
    public decimal RiskScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public decimal Probability { get; set; }
    public string ModelVersion { get; set; } = "rule-based-v1";
    public List<string> TopRiskFactors { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class PricingSuggestionRequest
{
    public long VehicleId { get; set; }
    public decimal BasePricePerDay { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}

public class PricingSuggestionDto
{
    public decimal SuggestedPricePerDay { get; set; }
    public string Explanation { get; set; } = string.Empty;
}
