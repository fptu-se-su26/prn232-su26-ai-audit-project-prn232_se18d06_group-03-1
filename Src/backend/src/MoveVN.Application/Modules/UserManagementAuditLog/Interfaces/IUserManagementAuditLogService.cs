namespace MoveVN.Application.Modules.UserManagementAuditLog.Interfaces;

public interface IUserManagementAuditLogService
{
    Task LogAsync(long actorId, string actorName, string actorRole, string action,
                  long targetUserId, string targetUserName,
                  string? oldValue = null, string? newValue = null,
                  string? ipAddress = null, CancellationToken ct = default);

    Task<List<UserManagementAuditLogItem>> GetByTargetUserIdAsync(long targetUserId, int limit = 50, CancellationToken ct = default);
}

public class UserManagementAuditLogItem
{
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; }
}