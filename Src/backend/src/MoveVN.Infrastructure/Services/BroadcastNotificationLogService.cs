using MoveVN.Application.Interfaces;
using MoveVN.Domain.Documents;
using MoveVN.Infrastructure.Persistence.Mongo;

namespace MoveVN.Infrastructure.Services;

public class BroadcastNotificationLogService : IBroadcastNotificationLogService
{
    private readonly MongoDbContext _context;

    public BroadcastNotificationLogService(MongoDbContext context)
    {
        _context = context;
    }

    public async Task LogBroadcastAsync(BroadcastNotificationLogDocument log, CancellationToken cancellationToken = default)
    {
        await _context.BroadcastNotificationLogs.InsertOneAsync(log, cancellationToken: cancellationToken);
    }
}
