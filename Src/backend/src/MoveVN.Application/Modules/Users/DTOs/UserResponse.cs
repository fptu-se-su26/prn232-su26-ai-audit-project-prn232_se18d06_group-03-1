namespace MoveVN.Application.Modules.Users.DTOs;

public class UserResponse
{
    public long UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public bool IsEmailVerified { get; set; }

    public string? Phone { get; set; }

    public string? AvatarUrl { get; set; }
}
