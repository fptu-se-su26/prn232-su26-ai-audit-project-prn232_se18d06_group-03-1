namespace MoveVN.Application.Modules.Auth.DTOs;

using System.Text.Json.Serialization;

public class GoogleLoginRequest
{
    public string AccessToken { get; set; } = string.Empty;

    [JsonIgnore]
    public string? IpAddress { get; set; }

    [JsonIgnore]
    public string? UserAgent { get; set; }
}
