namespace MoveVN.Domain.Entities;

public class OtpCode
{
    public long Id { get; set; }
    public long? UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string OtpCodeHash { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public bool IsUsed { get; set; }
    public byte Attempts { get; set; }
    public string? IpAddress { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

