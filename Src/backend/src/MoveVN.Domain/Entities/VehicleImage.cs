namespace MoveVN.Domain.Entities;

public class VehicleImage
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public byte SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

