namespace MoveVN.Domain.Entities;

public class Promotion
{
    public long Id { get; set; }
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
    public int MaxUsageCount { get; set; }
    public int UsageCount { get; set; }
    public bool IsActive { get; set; } = true;
    public string ApprovalStatus { get; set; } = "Approved";
    public string CreatedByRole { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
