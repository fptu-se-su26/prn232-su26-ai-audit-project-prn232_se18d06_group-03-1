namespace MoveVN.Application.Modules.Auth.DTOs;

public class AuthResponse
{
    public TokenResponse Token { get; set; } = new();
    public AuthUserResponse User { get; set; } = new();
}
