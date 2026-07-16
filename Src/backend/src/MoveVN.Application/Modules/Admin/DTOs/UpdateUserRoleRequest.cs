namespace MoveVN.Application.Modules.Admin.DTOs;

public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
    public bool Assigned { get; set; }
}
