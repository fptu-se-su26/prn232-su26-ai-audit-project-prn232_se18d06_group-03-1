namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class VehicleAvailabilityResponse
{
    public long VehicleId { get; set; }
    public List<BusyPeriod> BusyPeriods { get; set; } = [];
}

public class BusyPeriod
{
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Type { get; set; } = ""; // "booking" or "blocked"
}
