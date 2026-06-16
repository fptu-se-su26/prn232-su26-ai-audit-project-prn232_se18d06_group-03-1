namespace MoveVN.Application.Modules.Bookings.DTOs;

public class CreateBookingRequest
{
    public long VehicleId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
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
    public string VehicleName { get; set; } = string.Empty;
    public string? VehiclePrimaryImage { get; set; }
    public long OwnerId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int TotalDays { get; set; }
    public decimal BasePrice { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal DepositAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string PickupAddress { get; set; } = string.Empty;
    public string? CustomerNote { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? RiskScore { get; set; }
    public string? CancelReason { get; set; }
    public string? ContractUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<BookingStatusHistoryDto> StatusHistory { get; set; } = new();
}

public class BookingStatusHistoryDto
{
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ApproveBookingRequest
{
    public bool Approve { get; set; }
    public string? Reason { get; set; }
}

public class BookingQueryRequest
{
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
