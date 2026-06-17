namespace MoveVN.Domain.Entities;

public class StaffPermission
{
    public long UserId { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
