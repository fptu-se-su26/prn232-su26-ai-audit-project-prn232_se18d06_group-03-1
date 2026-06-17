using MoveVN.Application.Modules.System.DTOs;

namespace MoveVN.Application.Modules.System.Interfaces;

public interface ITrustScoreService
{
    Task RecalculateAllAsync(CancellationToken cancellationToken = default);
    Task<TrustScoreDto?> GetByUserAsync(long userId, CancellationToken cancellationToken = default);
    Task<List<TrustScoreHistoryDto>> GetHistoryByUserAsync(long userId, int take = 10, CancellationToken cancellationToken = default);
}
