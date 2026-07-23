namespace MoveVN.Domain.Entities;

public static class VehicleStatus
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Hidden = "Hidden";
}

public class Vehicle
{
    public long Id { get; set; }
    public long OwnerId { get; set; }
    public int BrandId { get; set; }
    public int ModelId { get; set; }
    public int? VariantId { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public int? OdometerKm { get; set; }
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public int? AreaId { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal PricePerDay { get; set; }
    public int DepositPercent { get; set; }
    public string Status { get; set; } = VehicleStatus.Pending;
    public long? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public VehicleBrand Brand { get; set; } = null!;
    public VehicleModel Model { get; set; } = null!;
    public VehicleModelVariant? Variant { get; set; }
    public Area? Area { get; set; }
}

