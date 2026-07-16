namespace MoveVN.Application.Modules.Bookings.DTOs;

public class CreateBookingRequest
{
    public long VehicleId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string PickupAddress { get; set; } = string.Empty;
    public string? ReturnAddress { get; set; }
    public string? CustomerNote { get; set; }
}

public class BookingResponse
{
    public long Id { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public long CustomerId { get; set; }
    public long VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public string? VehicleImage { get; set; }
    public long OwnerId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public decimal BasePrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal DepositAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal EscrowAmount { get; set; }
    public string EscrowStatus { get; set; } = "None";
    public DateTime? EscrowHeldAt { get; set; }
    public DateTime? EscrowSettledAt { get; set; }
    public DateTime? PaymentDueAt { get; set; }
    public string PickupAddress { get; set; } = string.Empty;
    public string? ReturnAddress { get; set; }
    public string? CustomerNote { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? RiskScore { get; set; }
    public string? RiskLevel { get; set; }
    public List<string> RiskFactors { get; set; } = new();
    public string? CancelReason { get; set; }
    public string? CancellationPolicyTier { get; set; }
    public decimal CancellationRefundAmount { get; set; }
    public decimal CancellationForfeitedAmount { get; set; }
    public decimal CancellationOwnerCompensation { get; set; }
    public decimal CancellationPlatformFee { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<BookingStatusHistoryDto> StatusHistory { get; set; } = new();
}

public class BookingStatusHistoryDto
{
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = string.Empty;
    public long? ChangedBy { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ApproveBookingRequest
{
    public bool Approve { get; set; }
    public string? Reason { get; set; }
}

public class RejectBookingRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class BookingListRequest
{
    public string? Status { get; set; }
    public string? Keyword { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CancelBookingRequest
{
    public string? Reason { get; set; }
}

public class BookingCancellationQuote
{
    public long BookingId { get; set; }
    public bool CanCancel { get; set; }
    public bool HasPaidDeposit { get; set; }
    public decimal PaidDepositAmount { get; set; }
    public int RefundPercent { get; set; }
    public decimal RefundAmount { get; set; }
    public decimal ForfeitedAmount { get; set; }
    public double HoursBeforePickup { get; set; }
    public string PolicyMessage { get; set; } = string.Empty;
}
