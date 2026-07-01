namespace MoveVN.Application.Modules.VehicleModels.DTOs;

public class CreateVehicleModelRequest
{
    public int BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
}
