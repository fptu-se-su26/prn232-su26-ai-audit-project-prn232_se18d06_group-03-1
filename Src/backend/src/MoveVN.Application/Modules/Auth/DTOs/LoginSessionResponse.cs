namespace MoveVN.Application.Modules.Auth.DTOs;

public class LoginSessionResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string? DeviceType { get; set; }
    public string? IpAddress { get; set; }
    public DateTime SignedInAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
}
