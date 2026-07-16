namespace MoveVN.Application.Modules.Auth.DTOs;

public class TokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string AccessTokenJti { get; set; } = string.Empty;
    public DateTime AccessTokenExpiresAt { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiresAt { get; set; }
    public string SessionId { get; set; } = string.Empty;
}
