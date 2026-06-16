using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Api.Hubs;

public class UserPresenceHub : Hub
{
    private readonly AppDbContext _db;

    public UserPresenceHub(AppDbContext db)
    {
        _db = db;
    }

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "presence");
        await UpdateUserPresence(true);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await UpdateUserPresence(false);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendPresenceUpdate(long userId, bool isOnline)
    {
        await Clients.All.SendAsync("PresenceChanged", new { UserId = userId, IsOnline = isOnline });
    }

    private async Task UpdateUserPresence(bool isOnline)
    {
        var userIdStr = Context.UserIdentifier;
        if (long.TryParse(userIdStr, out var userId))
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is not null)
            {
                user.IsOnline = isOnline;
                user.LastSeenAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                await Clients.All.SendAsync("PresenceChanged", new { userId, isOnline, lastSeenAt = DateTime.UtcNow });
            }
        }
    }
}
