namespace MoveVN.Domain.Entities;

public class VehiclePricing
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public string PricingMode { get; set; } = string.Empty;
    public decimal? FixedPricePerDay { get; set; }
    public decimal? AutoMinPrice { get; set; }
    public decimal? AutoMaxPrice { get; set; }
    public decimal CurrentPricePerDay { get; set; }
    public DateTime? LastCalculatedAt { get; set; }
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}

