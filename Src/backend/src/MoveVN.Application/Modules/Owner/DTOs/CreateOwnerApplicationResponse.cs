namespace MoveVN.Application.Modules.Owner.DTOs;

public class CreateOwnerApplicationResponse
{
    public long Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string NextStep { get; set; } = string.Empty;
}
