using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Notifications.Interfaces;

public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(Notification notification, CancellationToken cancellationToken = default);
    void Update(Notification notification);
    Task<PagedResult<NotificationDto>> GetPagedAsync(long userId, bool? unreadOnly, int page, int pageSize, CancellationToken cancellationToken = default);
    Task MarkAllReadAsync(long userId, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(long userId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface INotificationHub
{
    Task SendToUserAsync(long userId, NotificationDto notification);
}
