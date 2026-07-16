using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Enums;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Services;

public class LoginSessionService : ILoginSessionService
{
    private readonly AppDbContext _dbContext;
    private readonly MongoDbContext _mongoContext;
    private readonly ITokenSessionService _tokenSessionService;

    public LoginSessionService(
        AppDbContext dbContext,
        MongoDbContext mongoContext,
        ITokenSessionService tokenSessionService)
    {
        _dbContext = dbContext;
        _mongoContext = mongoContext;
        _tokenSessionService = tokenSessionService;
    }

    public async Task<IReadOnlyList<LoginSessionResponse>> GetAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var userIdText = userId.ToString();
        var loginEvents = new[]
        {
            AuthEventType.LoginSucceeded.ToString(),
            AuthEventType.GoogleLogin.ToString()
        };

        var logs = await _mongoContext.UserActivityLogs
            .Find(x => x.UserId == userIdText
                && x.SessionId != string.Empty
                && loginEvents.Contains(x.Event))
            .SortByDescending(x => x.Timestamp)
            .ToListAsync(cancellationToken);

        var latestLogs = logs
            .GroupBy(x => x.SessionId)
            .Select(x => x.First())
            .ToList();
        var sessionIds = latestLogs.Select(x => x.SessionId).ToArray();
        var tokens = await _dbContext.RefreshTokens
            .AsNoTracking()
            .Where(x => x.UserId == userId && sessionIds.Contains(x.SessionId))
            .ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;

        return latestLogs.Select(log =>
        {
            var sessionTokens = tokens.Where(x => x.SessionId == log.SessionId).ToList();
            return new LoginSessionResponse
            {
                SessionId = log.SessionId,
                DeviceType = log.DeviceType,
                IpAddress = log.IpAddress,
                SignedInAt = log.Timestamp,
                ExpiresAt = sessionTokens.Count == 0 ? log.Timestamp : sessionTokens.Max(x => x.ExpiresAt),
                IsActive = sessionTokens.Any(x => x.RevokedAt == null && x.ExpiresAt > now)
            };
        }).ToList();
    }

    public Task RevokeAsync(long userId, string sessionId, CancellationToken cancellationToken = default)
    {
        return RevokeWhereAsync(userId, x => x.SessionId == sessionId, cancellationToken);
    }

    public Task RevokeOthersAsync(long userId, string currentSessionId, CancellationToken cancellationToken = default)
    {
        return RevokeWhereAsync(userId, x => x.SessionId != currentSessionId, cancellationToken);
    }

    private async Task RevokeWhereAsync(
        long userId,
        System.Linq.Expressions.Expression<Func<MoveVN.Domain.Entities.RefreshToken, bool>> predicate,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var tokens = await _dbContext.RefreshTokens
            .Where(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > now)
            .Where(predicate)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.RevokedAt = now;
            if (!string.IsNullOrWhiteSpace(token.AccessTokenJti))
            {
                await _tokenSessionService.RevokeAsync(token.AccessTokenJti, cancellationToken);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
