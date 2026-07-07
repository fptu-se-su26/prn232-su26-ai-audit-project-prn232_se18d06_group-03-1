namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class BlockedDateRequest
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public string? Reason { get; set; }
}
