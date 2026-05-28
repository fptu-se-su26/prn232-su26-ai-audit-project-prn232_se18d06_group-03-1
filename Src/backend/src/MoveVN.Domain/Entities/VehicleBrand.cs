namespace MoveVN.Domain.Entities;

public class VehicleBrand
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

