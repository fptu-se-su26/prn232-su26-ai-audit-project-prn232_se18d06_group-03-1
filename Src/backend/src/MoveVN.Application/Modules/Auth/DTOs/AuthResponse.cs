namespace MoveVN.Application.Modules.Auth.DTOs;

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime AccessTokenExpiry { get; set; }

    // backward compat
    public string Token => AccessToken;
    public AuthUserResponse User { get; set; } = new();
}
