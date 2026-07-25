namespace MoveVN.Domain.Entities;

public class VoucherClaim
{
    public long Id { get; set; }
    public long CustomerId { get; set; }
    public long PromotionId { get; set; }
    public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }
    public long? BookingId { get; set; }
}
