using MoveVN.Application.Modules.Notifications.DTOs;

namespace MoveVN.Application.Common.Interfaces;

public interface INotificationRealtimeDispatcher
{
    Task SendCreatedAsync(long userId, NotificationResponse notification, int unreadCount, CancellationToken cancellationToken = default);
    Task SendUnreadCountAsync(long userId, int unreadCount, CancellationToken cancellationToken = default);
}
