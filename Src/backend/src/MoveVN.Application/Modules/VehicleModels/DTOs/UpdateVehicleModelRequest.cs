namespace MoveVN.Application.Modules.VehicleModels.DTOs;

public class UpdateVehicleModelRequest
{
    public int BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
