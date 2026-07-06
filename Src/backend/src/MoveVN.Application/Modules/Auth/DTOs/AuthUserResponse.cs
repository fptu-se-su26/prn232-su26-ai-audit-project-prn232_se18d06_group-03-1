namespace MoveVN.Application.Modules.Auth.DTOs;

public class AuthUserResponse
{
    public long UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public bool IsEmailVerified { get; set; }

    public string? Phone { get; set; }

    public string? AvatarUrl { get; set; }

    public IList<string> Roles { get; set; } = new List<string>();
}
