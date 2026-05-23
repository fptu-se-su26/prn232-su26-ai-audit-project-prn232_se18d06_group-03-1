namespace MoveVN.Application.Modules.Auth.DTOs;

public class AuthUserResponse
{
    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public IList<string> Roles { get; set; } = new List<string>();
}
