namespace MoveVN.Domain.Entities;

public class VehicleModelPricing
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public VehicleModel Model { get; set; } = null!;
    public decimal BasePrice { get; set; }
    public decimal SuggestedMinPrice { get; set; }
    public decimal SuggestedMaxPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

