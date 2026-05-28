namespace MoveVN.Infrastructure.Caching;

public static class RedisKeys
{
    public static string Session(string jti) => $"session:{jti}";
    public static string OtpRate(string email) => $"otp_rate:{email.ToLowerInvariant()}";
    public static string OtpLock(string email) => $"otp_lock:{email.ToLowerInvariant()}";
    public static string LoginFail(string ipAddress) => $"login_fail:{ipAddress}";
    public static string RefreshBlacklist(string jti) => $"refresh_blacklist:{jti}";
    public static string Online(long userId) => $"online:{userId}";
    public static string Typing(string roomId, long userId) => $"typing:{roomId}:{userId}";
    public static string VehicleDateLock(long vehicleId, DateOnly date) => $"lock:vehicle:{vehicleId}:{date:yyyy-MM-dd}";
    public static string VehicleAvailability(long vehicleId, string yearMonth) => $"avail:{vehicleId}:{yearMonth}";
    public static string BookingDraft(string sessionId) => $"booking:draft:{sessionId}";
    public static string Price(long vehicleId) => $"price:{vehicleId}";
    public static string ChatPresence(string roomId) => $"presence:{roomId}";
    public static string ChatUnread(long userId, string roomId) => $"unread:{userId}:{roomId}";
    public static string ChatLast(string roomId) => $"chat:last:{roomId}";
    public static string NotificationUnread(long userId) => $"notif:unread:{userId}";
    public static string NotificationSent(long userId, string type) => $"notif:sent:{userId}:{type}";
    public static string NotificationPreferences(long userId) => $"notif:prefs:{userId}";
    public static string Search(string queryHash) => $"search:{queryHash}";
    public static string PopularVehicles(string city) => $"popular:vehicles:{city.ToLowerInvariant()}";
    public static string Config(string key) => $"config:{key}";

    public const string PresenceList = "presence:list";
    public const string PricingRules = "pricing_rules";
    public const string FeatureFlags = "feature_flags";
}
