namespace MoveVN.Application.Modules.VehicleBrands.DTOs;

public class VehicleBrandResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
