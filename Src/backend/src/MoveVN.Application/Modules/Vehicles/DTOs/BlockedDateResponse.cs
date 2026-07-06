namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class BlockedDateResponse
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? Reason { get; set; }
}
