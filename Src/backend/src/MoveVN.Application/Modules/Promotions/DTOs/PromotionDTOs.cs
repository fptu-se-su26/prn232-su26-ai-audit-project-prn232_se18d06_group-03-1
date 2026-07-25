namespace MoveVN.Application.Modules.Promotions.DTOs;

public class CreatePromotionRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = "Fixed";
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public string VehicleType { get; set; } = "All";
    public string WhoBears { get; set; } = "System";
    public decimal? OwnerBearsPercent { get; set; }
    public long? OwnerId { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int MaxUsageCount { get; set; } = 100;
}

public class UpdatePromotionRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public string? VehicleType { get; set; }
    public string? WhoBears { get; set; }
    public decimal? OwnerBearsPercent { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? MaxUsageCount { get; set; }
    public bool? IsActive { get; set; }
}

public class PromotionResponse
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public string WhoBears { get; set; } = string.Empty;
    public decimal? OwnerBearsPercent { get; set; }
    public long? OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int MaxUsageCount { get; set; }
    public int UsageCount { get; set; }
    public bool IsActive { get; set; }
    public string ApprovalStatus { get; set; } = "Approved";
    public string CreatedByRole { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; }
}

public class ApplyPromotionRequest
{
    public string Code { get; set; } = string.Empty;
    public long VehicleId { get; set; }
    public decimal TotalAmount { get; set; }
}

public class ApplyPromotionResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public long PromotionId { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public decimal SystemPaidAmount { get; set; }
    public decimal OwnerPaidAmount { get; set; }
    public decimal FinalAmount { get; set; }
}

public class PromotionUsageResponse
{
    public long Id { get; set; }
    public long PromotionId { get; set; }
    public string PromotionCode { get; set; } = string.Empty;
    public long BookingId { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string? UserName { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal SystemPaidAmount { get; set; }
    public decimal OwnerPaidAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}
