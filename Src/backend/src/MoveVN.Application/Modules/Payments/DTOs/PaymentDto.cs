namespace MoveVN.Application.Modules.Payments.DTOs;

public class CreatePaymentRequest
{
    public long BookingId { get; set; }
    public string Type { get; set; } = "Deposit"; // Deposit | Full | Refund
    public string Gateway { get; set; } = "Mock";  // Mock | VNPay
    public string IdempotencyKey { get; set; } = Guid.NewGuid().ToString();
}

public class PaymentResponse
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string Gateway { get; set; } = string.Empty;
    public string? GatewayTransactionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MockPaymentRequest
{
    public long BookingId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
}
