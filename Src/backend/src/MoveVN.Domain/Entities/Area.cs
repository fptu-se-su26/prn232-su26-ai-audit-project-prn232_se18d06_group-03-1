namespace MoveVN.Domain.Entities;

public class Area
{
    public int Id { get; set; }
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
    public bool IsActive { get; set; } = true;
}

