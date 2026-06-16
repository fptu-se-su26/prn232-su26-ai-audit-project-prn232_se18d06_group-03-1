namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class CreateBlockedDateRequest
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public string? Reason { get; set; }
}

public class BlockedDateDto
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
}
