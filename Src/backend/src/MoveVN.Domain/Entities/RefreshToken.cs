namespace MoveVN.Domain.Entities;

public class RefreshToken
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public string? DeviceInfo { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? AccessTokenJti { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

