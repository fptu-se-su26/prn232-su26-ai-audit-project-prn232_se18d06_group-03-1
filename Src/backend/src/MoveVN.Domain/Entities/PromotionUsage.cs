namespace MoveVN.Domain.Entities;

public class PromotionUsage
{
    public long Id { get; set; }
    public long PromotionId { get; set; }
    public long BookingId { get; set; }
    public long UserId { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal SystemPaidAmount { get; set; }
    public decimal OwnerPaidAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
