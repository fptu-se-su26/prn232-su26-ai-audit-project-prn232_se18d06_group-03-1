namespace MoveVN.Domain.Entities;

public class PricingRegion
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Coefficient { get; set; } = 1.00m;
    public bool IsActive { get; set; } = true;
}

