using System.Text.Json;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.AuditLogs.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.AuditLogs.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repo;
    private readonly IUnitOfWork _unitOfWork;

    public AuditLogService(IAuditLogRepository repo, IUnitOfWork unitOfWork)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(long actorId, string actorRole, string action,
                               string entityType, long? entityId,
                               object? oldValue = null, object? newValue = null,
                               string? ipAddress = null, CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            ActorId = actorId,
            ActorRole = actorRole,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValue = oldValue != null ? JsonSerializer.Serialize(oldValue) : null,
            NewValue = newValue != null ? JsonSerializer.Serialize(newValue) : null,
            IpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(log, ct);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
