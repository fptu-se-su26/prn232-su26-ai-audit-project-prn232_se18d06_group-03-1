namespace MoveVN.Domain.Entities;

public class VehicleFeatureMapping
{
    public long VehicleId { get; set; }
    public int FeatureId { get; set; }

    public Vehicle? Vehicle { get; set; }
    public VehicleFeature? Feature { get; set; }
}

