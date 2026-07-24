namespace MoveVN.Application.Modules.Notifications.DTOs;

public class NotificationResponse
{
    public long Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? DataJson { get; set; }
    public string Channel { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNotificationRequest
{
    public long UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? DataJson { get; set; }
    public string Channel { get; set; } = "InApp";
}

public class NotificationUnreadCountResponse
{
    public int UnreadCount { get; set; }
}

public class MarkAllNotificationsReadResponse
{
    public int UpdatedCount { get; set; }
}

public class BroadcastNotificationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Channel { get; set; } = "InApp";
    public string TargetType { get; set; } = "All";
    public List<string> TargetRoles { get; set; } = [];
    public List<long> TargetUserIds { get; set; } = [];
}

public class BroadcastNotificationResponse
{
    public int TotalTargeted { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = [];
}
