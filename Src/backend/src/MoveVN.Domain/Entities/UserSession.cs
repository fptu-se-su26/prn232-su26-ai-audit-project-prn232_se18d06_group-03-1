namespace MoveVN.Domain.Entities;

public class UserSession
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public string? DeviceType { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastHeartbeatAt { get; set; } = DateTime.UtcNow;
    public DateTime? DisconnectedAt { get; set; }
}

