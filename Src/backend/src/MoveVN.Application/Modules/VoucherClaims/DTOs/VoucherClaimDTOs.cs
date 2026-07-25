namespace MoveVN.Application.Modules.VoucherClaims.DTOs;

public class VoucherClaimResponse
{
    public long Id { get; set; }
    public long PromotionId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public DateTime? EndAt { get; set; }
    public int MaxUsageCount { get; set; }
    public int UsageCount { get; set; }
    public DateTime ClaimedAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public long? BookingId { get; set; }
}

public class VoucherHuntItem
{
    public long PromotionId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public DateTime? EndAt { get; set; }
    public int MaxUsageCount { get; set; }
    public int UsageCount { get; set; }
    public bool IsClaimed { get; set; }
}
