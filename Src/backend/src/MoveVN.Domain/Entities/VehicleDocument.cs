namespace MoveVN.Domain.Entities;

public class VehicleDocument
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public string DocType { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public DateOnly? ExpiryDate { get; set; }
    public bool Verified { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

