using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MoveVN.Application.Modules.Auth.Services;

public class AuthLogService : IAuthLogService
{
    private readonly IAuthLogRepository _repo;

    public AuthLogService(IAuthLogRepository repo)
    {
        _repo = repo;
    }

    public async Task LogAsync(long? userId, string? email, string eventType, bool success,
        string? ipAddress = null, string? userAgent = null, string? failReason = null,
        CancellationToken cancellationToken = default)
    {
        var log = new AuthLog
        {
            UserId = userId,
            Email = email,
            EventType = eventType,
            Success = success,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            FailReason = failReason,
            CreatedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(log, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResult<AuthLogDto>> GetLogsAsync(AuthLogQueryRequest request, CancellationToken cancellationToken = default)
    {
        return await _repo.GetPagedAsync(request, cancellationToken);
    }

    public async Task<IReadOnlyList<AuthLogDto>> GetUserLoginHistoryAsync(long userId, int limit = 10, CancellationToken cancellationToken = default)
    {
        return await _repo.GetUserHistoryAsync(userId, limit, cancellationToken);
    }
}
