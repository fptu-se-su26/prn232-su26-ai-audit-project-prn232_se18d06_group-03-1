using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;

namespace MoveVN.Api.Hubs;

[Authorize]
public class NotificationHub : Hub, INotificationHub
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationHub(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public override async Task OnConnectedAsync()
    {
        var userIdClaim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim is not null)
        {
            var groupName = $"user_{userIdClaim.Value}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }
        await base.OnConnectedAsync();
    }

    public async Task SendToUserAsync(long userId, NotificationDto notification)
    {
        await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", notification);
    }
}
