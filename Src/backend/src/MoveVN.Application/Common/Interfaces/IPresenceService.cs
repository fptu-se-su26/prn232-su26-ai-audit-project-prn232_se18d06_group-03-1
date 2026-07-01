namespace MoveVN.Application.Common.Interfaces;

public interface IPresenceService
{
    Task MarkOnlineAsync(long userId, string connectionId, CancellationToken cancellationToken = default);
    Task RefreshOnlineAsync(long userId, CancellationToken cancellationToken = default);
    Task MarkOfflineAsync(long userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<long, bool>> GetOnlineStatusesAsync(IEnumerable<long> userIds, CancellationToken cancellationToken = default);
}
