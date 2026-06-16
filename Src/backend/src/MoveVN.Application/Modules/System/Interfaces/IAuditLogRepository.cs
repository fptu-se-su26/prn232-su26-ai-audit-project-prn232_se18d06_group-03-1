using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.System.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken cancellationToken = default);
    Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryRequest request, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
