namespace MoveVN.Domain.Entities;

public class Booking
{
    public long Id { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public long CustomerId { get; set; }
    public long VehicleId { get; set; }
    public long OwnerId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int TotalDays { get; set; }
    public decimal BasePrice { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal DepositAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string PickupAddress { get; set; } = string.Empty;
    public string ReturnAddress { get; set; } = string.Empty;
    public string? CustomerNote { get; set; }
    public string Status { get; set; } = "Pending";
    public decimal? RiskScore { get; set; }
    public long? CancelledBy { get; set; }
    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public long? PlatformFeeRuleId { get; set; }
    public string PlatformFeeType { get; set; } = string.Empty;
    public decimal PlatformFeeValue { get; set; }
}

