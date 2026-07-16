namespace MoveVN.Application.Modules.Admin.DTOs;

public class AdminUpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
}
