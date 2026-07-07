using Microsoft.AspNetCore.SignalR;
using MoveVN.Api.Hubs;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;

namespace MoveVN.Api.Services;

public class SignalRNotificationRealtimeDispatcher : INotificationRealtimeDispatcher
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationRealtimeDispatcher(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendCreatedAsync(long userId, NotificationResponse notification, int unreadCount, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients
            .Group(NotificationHubGroups.User(userId))
            .SendAsync("notification.created", new { notification, unreadCount }, cancellationToken);
    }

    public async Task SendUnreadCountAsync(long userId, int unreadCount, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients
            .Group(NotificationHubGroups.User(userId))
            .SendAsync("notification.unreadCountChanged", new { unreadCount }, cancellationToken);
    }
}
