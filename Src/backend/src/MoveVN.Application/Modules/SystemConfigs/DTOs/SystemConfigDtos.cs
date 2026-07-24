namespace MoveVN.Application.Modules.SystemConfigs.DTOs;

public static class SystemConfigKeys
{
    public const string BookingAutoCancelEnabled = "booking_auto_cancel_enabled";
    public const string AutoCancelHours = "auto_cancel_hours";
    public const string CheckInReminderHours = "checkin_reminder_hours";
    public const string CheckOutReminderHours = "checkout_reminder_hours";
    public const string BookingReminderEnabled = "booking_reminder_enabled";
    public const string BookingReminderScanMinutes = "booking_reminder_scan_minutes";
    public const string NotificationEmailEnabled = "notification_email_enabled";
    public const string RiskThreshold = "risk_threshold";

    public static readonly IReadOnlyList<SystemConfigDefinition> Definitions =
    [
        new(BookingAutoCancelEnabled, "Background jobs", "Auto-cancel booking", "bool", "true", "Cho phep job tu dong huy booking het han."),
        new(AutoCancelHours, "Background jobs", "Gio cho owner phan hoi", "int", "24", "So gio booking Pending duoc giu truoc khi tu dong tu choi."),
        new(BookingReminderEnabled, "Background jobs", "Reminder check-in/out", "bool", "true", "Cho phep gui nhac check-in/check-out tu dong."),
        new(BookingReminderScanMinutes, "Background jobs", "Tan suat quet reminder", "int", "60", "So phut giua hai lan quet reminder."),
        new(CheckInReminderHours, "Reminder", "Nhac check-in truoc", "int", "2", "So gio truoc thoi diem nhan xe de gui nhac."),
        new(CheckOutReminderHours, "Reminder", "Nhac check-out truoc", "int", "2", "So gio truoc thoi diem tra xe de gui nhac."),
        new(NotificationEmailEnabled, "Notification", "Gui email notification", "bool", "true", "Bat/tat email di kem notification he thong."),
        new(RiskThreshold, "Risk", "Nguong risk score", "decimal", "70", "Nguong diem rui ro de danh dau booking can theo doi.")
    ];
}

public record SystemConfigDefinition(
    string ConfigKey,
    string Category,
    string DisplayName,
    string DataType,
    string DefaultValue,
    string Description);

public class SystemConfigResponse
{
    public int Id { get; set; }
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateSystemConfigRequest
{
    public List<UpdateSystemConfigItem> Items { get; set; } = [];
}

public class UpdateSystemConfigItem
{
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
}
