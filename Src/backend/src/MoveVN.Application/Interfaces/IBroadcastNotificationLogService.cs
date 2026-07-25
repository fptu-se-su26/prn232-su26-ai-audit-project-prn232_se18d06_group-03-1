using MoveVN.Domain.Documents;

namespace MoveVN.Application.Interfaces;

public interface IBroadcastNotificationLogService
{
    Task LogBroadcastAsync(BroadcastNotificationLogDocument log, CancellationToken cancellationToken = default);
}
