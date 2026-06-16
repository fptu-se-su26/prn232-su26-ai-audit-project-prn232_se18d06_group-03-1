using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;

namespace MoveVN.Application.Modules.Notifications.Interfaces;

public interface INotificationService
{
    Task SendAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(long userId, bool? unreadOnly, int page, int pageSize, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(long notificationId, long userId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(long userId, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(long userId, CancellationToken cancellationToken = default);
}
