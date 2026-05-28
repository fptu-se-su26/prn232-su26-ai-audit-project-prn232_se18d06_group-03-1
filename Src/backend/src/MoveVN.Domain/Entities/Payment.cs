namespace MoveVN.Domain.Entities;

public class Payment
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long PayerId { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string Gateway { get; set; } = string.Empty;
    public string? GatewayTransactionId { get; set; }
    public string Status { get; set; } = "Pending";
    public string IdempotencyKey { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

