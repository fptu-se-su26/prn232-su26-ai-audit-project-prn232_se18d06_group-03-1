namespace MoveVN.Domain.Entities;

/// <summary>
/// Ghi lại mọi sự kiện login/logout/fail cho mục đích audit.
/// </summary>
public class AuthLog
{
    public long Id { get; set; }
    public long? UserId { get; set; }
    public string? Email { get; set; }

    /// <summary>Login | Logout | LoginFailed | TokenRefreshed | SessionRevoked</summary>
    public string EventType { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? DeviceInfo { get; set; }
    public bool Success { get; set; }
    public string? FailReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
