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

    public static string OwnerApplicationSubmitLock(long userId) => $"owner_application:submit_lock:{userId}";
    public static string VerificationSubmitLock(long userId, string type) => $"verification:submit_lock:{userId}:{type}";
    public static string VerificationProcessing(long requestId) => $"verification:processing:{requestId}";
    public static string FaceEnrollLock(long userId) => $"face:enroll_lock:{userId}";
    public static string DriverLicenseUploadConsecutiveFailures(long userId, string vehicleType) => $"driver_license:upload:fail:consecutive:{userId}:{vehicleType}";
    public static string DriverLicenseUploadDailyFailures(long userId, string vehicleType, string dateKey) => $"driver_license:upload:fail:daily:{userId}:{vehicleType}:{dateKey}";
    public static string DriverLicenseUploadLock(long userId, string vehicleType) => $"driver_license:upload:lock:{userId}:{vehicleType}";
    public static string VehicleDocumentUploadConsecutiveFailures(long ownerId) => $"vehicle_document:upload:fail:consecutive:{ownerId}";
    public static string VehicleDocumentUploadDailyFailures(long ownerId, string dateKey) => $"vehicle_document:upload:fail:daily:{ownerId}:{dateKey}";
    public static string VehicleDocumentUploadLock(long ownerId) => $"vehicle_document:upload:lock:{ownerId}";

    public const string PresenceList = "presence:list";
    public const string PricingRules = "pricing_rules";
    public const string FeatureFlags = "feature_flags";
}
