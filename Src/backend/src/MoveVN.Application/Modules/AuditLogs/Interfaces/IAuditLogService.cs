namespace MoveVN.Application.Modules.AuditLogs.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(long actorId, string actorRole, string action,
                  string entityType, long? entityId,
                  object? oldValue = null, object? newValue = null,
                  string? ipAddress = null, CancellationToken ct = default);
}
