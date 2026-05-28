namespace MoveVN.Domain.Entities;

public class UserRole
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public int RoleId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public long? AssignedBy { get; set; }
}

