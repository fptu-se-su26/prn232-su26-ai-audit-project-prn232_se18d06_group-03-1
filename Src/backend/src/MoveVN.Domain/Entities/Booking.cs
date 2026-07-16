namespace MoveVN.Domain.Entities;

public class Booking
{
    public long Id { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public long CustomerId { get; set; }
    public long VehicleId { get; set; }
    public long OwnerId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public decimal BasePrice { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal DepositAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal EscrowAmount { get; set; }
    public string EscrowStatus { get; set; } = "None";
    public DateTime? EscrowHeldAt { get; set; }
    public DateTime? EscrowSettledAt { get; set; }
    public DateTime? PaymentDueAt { get; set; }
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
    public string? CancellationPolicyTier { get; set; }
    public string? CancellationSource { get; set; }
    public decimal CancellationRefundAmount { get; set; }
    public decimal CancellationForfeitedAmount { get; set; }
    public decimal CancellationOwnerCompensation { get; set; }
    public decimal CancellationPlatformFee { get; set; }
}

