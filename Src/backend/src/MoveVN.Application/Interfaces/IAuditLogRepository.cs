using MoveVN.Domain.Entities;

namespace MoveVN.Application.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken ct = default);
}
