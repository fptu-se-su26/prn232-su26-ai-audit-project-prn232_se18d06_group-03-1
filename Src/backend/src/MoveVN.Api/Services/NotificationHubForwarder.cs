using Microsoft.AspNetCore.SignalR;
using MoveVN.Api.Hubs;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;

namespace MoveVN.Api.Services;

public class NotificationHubForwarder : INotificationHub
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationHubForwarder(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUserAsync(long userId, NotificationDto notification)
    {
        await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", notification);
    }
}
