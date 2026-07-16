using MoveVN.Domain.Entities;

namespace MoveVN.Application.Interfaces;

public interface INotificationRepository
{
    IQueryable<Notification> Notifications { get; }
    Task<Notification?> GetByUserAsync(long id, long userId, CancellationToken cancellationToken = default);
    Task<NotificationPreference?> GetPreferenceByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task AddAsync(Notification notification, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
