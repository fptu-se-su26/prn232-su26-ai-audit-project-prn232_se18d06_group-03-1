namespace MoveVN.Application.Modules.Auth.DTOs;

using System.Text.Json.Serialization;

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;

    [JsonIgnore]
    public string? IpAddress { get; set; }

    [JsonIgnore]
    public string? UserAgent { get; set; }
}
