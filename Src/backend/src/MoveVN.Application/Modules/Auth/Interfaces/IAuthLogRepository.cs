using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IAuthLogRepository
{
    Task AddAsync(AuthLog log, CancellationToken cancellationToken = default);
    Task<PagedResult<AuthLogDto>> GetPagedAsync(AuthLogQueryRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AuthLogDto>> GetUserHistoryAsync(long userId, int limit, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
