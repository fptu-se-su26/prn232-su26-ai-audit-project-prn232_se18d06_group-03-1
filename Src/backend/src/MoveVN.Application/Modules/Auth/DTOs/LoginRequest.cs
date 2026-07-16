namespace MoveVN.Application.Modules.Auth.DTOs;

using System.Text.Json.Serialization;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    [JsonIgnore]
    public string? IpAddress { get; set; }

    [JsonIgnore]
    public string? UserAgent { get; set; }
}
