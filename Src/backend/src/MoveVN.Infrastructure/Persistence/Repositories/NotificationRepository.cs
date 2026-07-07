using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _context;

    public NotificationRepository(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<Notification> Notifications => _context.Notifications;

    public Task<Notification?> GetByUserAsync(long id, long userId, CancellationToken cancellationToken = default)
        => _context.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);

    public async Task AddAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        await _context.Notifications.AddAsync(notification, cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
