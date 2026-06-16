using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;
using System.Text.Json;

namespace MoveVN.Application.Modules.System.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repo;

    public AuditLogService(IAuditLogRepository repo)
    {
        _repo = repo;
    }

    public async Task LogAsync(long? actorId, string? actorRole, string action, string entityType,
        long? entityId = null, object? oldValue = null, object? newValue = null,
        string? ipAddress = null, string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        var log = new AuditLog
        {
            ActorId = actorId,
            ActorRole = actorRole,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValue = oldValue is null ? null : oldValue is string s ? s : JsonSerializer.Serialize(oldValue),
            NewValue = newValue is null ? null : newValue is string ns ? ns : JsonSerializer.Serialize(newValue),
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        await _repo.AddAsync(log, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);
    }
}
