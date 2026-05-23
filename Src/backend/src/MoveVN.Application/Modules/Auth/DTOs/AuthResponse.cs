namespace MoveVN.Application.Modules.Auth.DTOs;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;

    public AuthUserResponse User { get; set; } = new();
}
