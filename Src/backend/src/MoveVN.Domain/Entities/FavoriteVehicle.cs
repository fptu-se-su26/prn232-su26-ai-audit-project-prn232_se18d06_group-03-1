namespace MoveVN.Domain.Entities;

public class FavoriteVehicle
{
    public long Id { get; set; }
    public long CustomerId { get; set; }
    public long VehicleId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
