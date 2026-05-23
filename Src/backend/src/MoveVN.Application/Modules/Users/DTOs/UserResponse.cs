namespace MoveVN.Application.Modules.Users.DTOs;

public class UserResponse
{
    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string? Email { get; set; }
}
