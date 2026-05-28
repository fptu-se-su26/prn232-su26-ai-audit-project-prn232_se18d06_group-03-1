namespace MoveVN.Domain.Entities;

public class Vehicle
{
    public long Id { get; set; }
    public long OwnerId { get; set; }
    public int BrandId { get; set; }
    public int ModelId { get; set; }
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal PricePerDay { get; set; }
    public string Status { get; set; } = "Pending";
    public long? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

