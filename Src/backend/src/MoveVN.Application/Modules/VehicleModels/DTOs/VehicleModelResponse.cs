namespace MoveVN.Application.Modules.VehicleModels.DTOs;

public class VehicleModelResponse
{
    public int Id { get; set; }
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
