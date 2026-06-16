using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Notifications.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly INotificationHub _hub;

    public NotificationService(INotificationRepository repo, INotificationHub hub)
    {
        _repo = repo;
        _hub = hub;
    }

    public async Task SendAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            UserId = request.UserId,
            Type = request.Type,
            Title = request.Title,
            Body = request.Body,
            DataJson = request.DataJson,
            Channel = request.Channel,
            IsRead = false,
            SentAt = DateTime.UtcNow
        };

        await _repo.AddAsync(notification, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        // Push via SignalR (fire-and-forget, không block)
        _ = Task.Run(() => _hub.SendToUserAsync(request.UserId, new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Type = notification.Type,
            Title = notification.Title,
            Body = notification.Body,
            IsRead = false,
            CreatedAt = notification.CreatedAt
        }));
    }

    public async Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(long userId, bool? unreadOnly, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _repo.GetPagedAsync(userId, unreadOnly, page, pageSize, cancellationToken);
    }

    public async Task MarkAsReadAsync(long notificationId, long userId, CancellationToken cancellationToken = default)
    {
        var n = await _repo.GetByIdAsync(notificationId, cancellationToken);
        if (n is null || n.UserId != userId) return;

        n.IsRead = true;
        n.ReadAt = DateTime.UtcNow;
        _repo.Update(n);
        await _repo.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllAsReadAsync(long userId, CancellationToken cancellationToken = default)
    {
        await _repo.MarkAllReadAsync(userId, cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await _repo.GetUnreadCountAsync(userId, cancellationToken);
    }
}
