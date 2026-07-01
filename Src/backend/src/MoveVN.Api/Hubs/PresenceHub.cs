using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Api.Hubs;

[Authorize]
public class PresenceHub : Hub
{
    private readonly AppDbContext _dbContext;
    private readonly IPresenceService _presenceService;

    public PresenceHub(AppDbContext dbContext, IPresenceService presenceService)
    {
        _dbContext = dbContext;
        _presenceService = presenceService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId is null)
        {
            Context.Abort();
            return;
        }

        var now = DateTime.UtcNow;
        await _dbContext.UserSessions.AddAsync(new UserSession
        {
            UserId = userId.Value,
            ConnectionId = Context.ConnectionId,
            IpAddress = Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Context.GetHttpContext()?.Request.Headers.UserAgent.ToString(),
            ConnectedAt = now,
            LastHeartbeatAt = now
        }, Context.ConnectionAborted);

        await _dbContext.Users
            .Where(user => user.Id == userId.Value)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(user => user.IsOnline, true)
                .SetProperty(user => user.LastSeenAt, now)
                .SetProperty(user => user.UpdatedAt, now), Context.ConnectionAborted);

        await _dbContext.SaveChangesAsync(Context.ConnectionAborted);
        await _presenceService.MarkOnlineAsync(userId.Value, Context.ConnectionId, Context.ConnectionAborted);
        await Clients.All.SendAsync("UserPresenceChanged", userId.Value, true, now, Context.ConnectionAborted);

        await base.OnConnectedAsync();
    }

    public async Task Heartbeat()
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return;
        }

        var now = DateTime.UtcNow;
        await _dbContext.UserSessions
            .Where(session => session.ConnectionId == Context.ConnectionId && session.DisconnectedAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(session => session.LastHeartbeatAt, now), Context.ConnectionAborted);

        await _dbContext.Users
            .Where(user => user.Id == userId.Value)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(user => user.IsOnline, true)
                .SetProperty(user => user.LastSeenAt, now)
                .SetProperty(user => user.UpdatedAt, now), Context.ConnectionAborted);

        await _presenceService.RefreshOnlineAsync(userId.Value, Context.ConnectionAborted);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            await base.OnDisconnectedAsync(exception);
            return;
        }

        var now = DateTime.UtcNow;
        await _dbContext.UserSessions
            .Where(session => session.ConnectionId == Context.ConnectionId && session.DisconnectedAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(session => session.DisconnectedAt, now)
                .SetProperty(session => session.LastHeartbeatAt, now));

        var stillOnline = await _dbContext.UserSessions.AnyAsync(
            session => session.UserId == userId.Value
                && session.DisconnectedAt == null
                && session.LastHeartbeatAt >= now.AddMinutes(-2));

        if (stillOnline)
        {
            await _presenceService.RefreshOnlineAsync(userId.Value);
        }
        else
        {
            await _dbContext.Users
                .Where(user => user.Id == userId.Value)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(user => user.IsOnline, false)
                    .SetProperty(user => user.LastSeenAt, now)
                    .SetProperty(user => user.UpdatedAt, now));

            await _presenceService.MarkOfflineAsync(userId.Value);
            await Clients.All.SendAsync("UserPresenceChanged", userId.Value, false, now);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private long? GetUserId()
    {
        var rawUserId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Context.User?.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return long.TryParse(rawUserId, out var userId) ? userId : null;
    }
}
