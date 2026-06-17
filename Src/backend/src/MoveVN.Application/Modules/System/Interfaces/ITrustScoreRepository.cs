using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.System.Interfaces;

public interface ITrustScoreRepository
{
    Task<TrustScore?> GetByUserAsync(long userId, CancellationToken cancellationToken = default);
    Task<List<TrustScoreHistory>> GetHistoryByUserAsync(long userId, int take = 10, CancellationToken cancellationToken = default);
    Task AddAsync(TrustScore ts, CancellationToken cancellationToken = default);
    Task AddHistoryAsync(TrustScoreHistory history, CancellationToken cancellationToken = default);
    void Update(TrustScore ts);
    Task<List<(long userId, int completed, int cancelled, int reported, decimal? avgRating)>> GetAllUsersWithStatsAsync(CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
