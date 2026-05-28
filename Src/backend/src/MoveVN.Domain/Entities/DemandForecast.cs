namespace MoveVN.Domain.Entities;

public class DemandForecast
{
    public long Id { get; set; }
    public string District { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public DateOnly ForecastDate { get; set; }
    public int PredictedDemand { get; set; }
    public string ModelVersion { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

