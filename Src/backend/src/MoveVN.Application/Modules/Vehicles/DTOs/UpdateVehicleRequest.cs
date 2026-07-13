namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class UpdateVehicleRequest
{
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public int? OdometerKm { get; set; }
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public int? AreaId { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal PricePerDay { get; set; }
    public int DepositPercent { get; set; }
    public List<int> FeatureIds { get; set; } = [];
}
