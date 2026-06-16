using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Auth;

public class AuthLogRepository : IAuthLogRepository
{
    private readonly AppDbContext _context;

    public AuthLogRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AuthLog log, CancellationToken cancellationToken = default)
    {
        await _context.AuthLogs.AddAsync(log, cancellationToken);
    }

    public async Task<PagedResult<AuthLogDto>> GetPagedAsync(AuthLogQueryRequest request, CancellationToken cancellationToken = default)
    {
        var query = _context.AuthLogs.AsQueryable();

        if (request.UserId.HasValue)
            query = query.Where(x => x.UserId == request.UserId);
        if (!string.IsNullOrWhiteSpace(request.IpAddress))
            query = query.Where(x => x.IpAddress != null && x.IpAddress.Contains(request.IpAddress));
        if (!string.IsNullOrWhiteSpace(request.EventType))
            query = query.Where(x => x.EventType == request.EventType);
        if (request.DateFrom.HasValue)
            query = query.Where(x => x.CreatedAt >= request.DateFrom.Value);
        if (request.DateTo.HasValue)
            query = query.Where(x => x.CreatedAt <= request.DateTo.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new AuthLogDto
            {
                Id = x.Id,
                UserId = x.UserId,
                Email = x.Email,
                EventType = x.EventType,
                IpAddress = x.IpAddress,
                UserAgent = x.UserAgent,
                Success = x.Success,
                FailReason = x.FailReason,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<AuthLogDto>.Create(items, total, request.Page, request.PageSize);
    }

    public async Task<IReadOnlyList<AuthLogDto>> GetUserHistoryAsync(long userId, int limit, CancellationToken cancellationToken = default)
    {
        return await _context.AuthLogs
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .Select(x => new AuthLogDto
            {
                Id = x.Id,
                UserId = x.UserId,
                Email = x.Email,
                EventType = x.EventType,
                IpAddress = x.IpAddress,
                UserAgent = x.UserAgent,
                Success = x.Success,
                FailReason = x.FailReason,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
