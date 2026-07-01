namespace MoveVN.Application.Modules.Owner.DTOs;

public class SubmitOwnerApplicationResponse
{
    public string Status { get; set; } = string.Empty;
    public bool IsOwner { get; set; }
    public bool RequiresTokenRefresh { get; set; }
    public string NextStep { get; set; } = string.Empty;
}
