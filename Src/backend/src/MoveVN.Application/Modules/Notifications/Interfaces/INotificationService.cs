using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;

namespace MoveVN.Application.Modules.Notifications.Interfaces;

public interface INotificationService
{
    Task<PagedResult<NotificationResponse>> GetMineAsync(bool? unreadOnly, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<NotificationUnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default);
    Task<NotificationResponse> MarkAsReadAsync(long id, CancellationToken cancellationToken = default);
    Task<MarkAllNotificationsReadResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default);
    Task<NotificationResponse> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default);
    Task<BroadcastNotificationResponse> BroadcastAsync(BroadcastNotificationRequest request, CancellationToken cancellationToken = default);
}

