namespace MoveVN.Application.Modules.Auth.DTOs;

public class LogoutRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}
