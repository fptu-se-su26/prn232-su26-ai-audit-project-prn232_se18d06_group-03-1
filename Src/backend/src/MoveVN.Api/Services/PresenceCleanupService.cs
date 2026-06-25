using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Api.Services;

public class PresenceCleanupService : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan StaleSessionAge = TimeSpan.FromMinutes(2);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PresenceCleanupService> _logger;

    public PresenceCleanupService(IServiceScopeFactory scopeFactory, ILogger<PresenceCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(CleanupInterval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await CleanupAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Presence cleanup failed.");
            }
        }
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var presenceService = scope.ServiceProvider.GetRequiredService<IPresenceService>();
        var now = DateTime.UtcNow;
        var staleBefore = now.Subtract(StaleSessionAge);

        var staleUserIds = await dbContext.UserSessions
            .Where(session => session.DisconnectedAt == null && session.LastHeartbeatAt < staleBefore)
            .Select(session => session.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (staleUserIds.Count == 0)
        {
            return;
        }

        await dbContext.UserSessions
            .Where(session => session.DisconnectedAt == null && session.LastHeartbeatAt < staleBefore)
            .ExecuteUpdateAsync(setters => setters.SetProperty(session => session.DisconnectedAt, now), cancellationToken);

        foreach (var userId in staleUserIds)
        {
            var stillOnline = await dbContext.UserSessions.AnyAsync(
                session => session.UserId == userId
                    && session.DisconnectedAt == null
                    && session.LastHeartbeatAt >= staleBefore,
                cancellationToken);

            if (stillOnline)
            {
                await presenceService.RefreshOnlineAsync(userId, cancellationToken);
                continue;
            }

            await dbContext.Users
                .Where(user => user.Id == userId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(user => user.IsOnline, false)
                    .SetProperty(user => user.LastSeenAt, now)
                    .SetProperty(user => user.UpdatedAt, now), cancellationToken);

            await presenceService.MarkOfflineAsync(userId, cancellationToken);
        }
    }
}
