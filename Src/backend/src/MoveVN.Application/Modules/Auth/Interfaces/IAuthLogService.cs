using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IAuthLogService
{
    Task LogAsync(long? userId, string? email, string eventType, bool success,
        string? ipAddress = null, string? userAgent = null, string? failReason = null,
        CancellationToken cancellationToken = default);

    Task<PagedResult<AuthLogDto>> GetLogsAsync(AuthLogQueryRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AuthLogDto>> GetUserLoginHistoryAsync(long userId, int limit = 10, CancellationToken cancellationToken = default);
}
