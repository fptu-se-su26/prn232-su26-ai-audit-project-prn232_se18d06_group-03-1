namespace MoveVN.Domain.Entities;

public class NotificationPreference
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public bool InAppEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; }
    public bool ZaloEnabled { get; set; }
    public TimeOnly? QuietHoursStart { get; set; }
    public TimeOnly? QuietHoursEnd { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

