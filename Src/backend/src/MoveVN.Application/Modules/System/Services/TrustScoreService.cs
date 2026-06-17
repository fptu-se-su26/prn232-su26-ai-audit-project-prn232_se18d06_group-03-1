using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.System.Services;

public class TrustScoreService : ITrustScoreService
{
    private readonly ITrustScoreRepository _repo;

    public TrustScoreService(ITrustScoreRepository repo)
    {
        _repo = repo;
    }

    public async Task RecalculateAllAsync(CancellationToken cancellationToken = default)
    {
        var users = await _repo.GetAllUsersWithStatsAsync(cancellationToken);

        foreach (var (userId, completedTrips, cancelCount, reportCount, avgRating) in users)
        {
            var raw = completedTrips * 5m
                    - cancelCount * 10m
                    - reportCount * 15m
                    + (avgRating ?? 0) * 10m;

            var score = Math.Clamp(raw, 0m, 100m);
            var tier = score switch
            {
                >= 80 => "Diamond",
                >= 60 => "Gold",
                >= 40 => "Silver",
                _ => "New"
            };

            var existing = await _repo.GetByUserAsync(userId, cancellationToken);
            if (existing is null)
            {
                await _repo.AddAsync(new TrustScore
                {
                    UserId = userId,
                    Score = score,
                    Tier = tier,
                    CompletedTrips = completedTrips,
                    CancellationCount = cancelCount,
                    ReportCount = reportCount,
                    AverageRating = avgRating,
                    LastCalculatedAt = DateTime.UtcNow
                }, cancellationToken);
            }
            else
            {
                existing.Score = score;
                existing.Tier = tier;
                existing.CompletedTrips = completedTrips;
                existing.CancellationCount = cancelCount;
                existing.ReportCount = reportCount;
                existing.AverageRating = avgRating;
                existing.LastCalculatedAt = DateTime.UtcNow;
                _repo.Update(existing);
            }

            await _repo.AddHistoryAsync(new TrustScoreHistory
            {
                UserId = userId,
                Score = score,
                Tier = tier,
                CompletedTrips = completedTrips,
                CancellationCount = cancelCount,
                ReportCount = reportCount,
                AverageRating = avgRating,
                CalculatedAt = DateTime.UtcNow
            }, cancellationToken);
        }

        await _repo.SaveChangesAsync(cancellationToken);
    }

    public async Task<TrustScoreDto?> GetByUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        var ts = await _repo.GetByUserAsync(userId, cancellationToken);
        if (ts is null) return null;

        return new TrustScoreDto
        {
            UserId = ts.UserId,
            Score = ts.Score,
            Tier = ts.Tier,
            CompletedTrips = ts.CompletedTrips,
            CancellationCount = ts.CancellationCount,
            ReportCount = ts.ReportCount,
            AverageRating = ts.AverageRating,
            LastCalculatedAt = ts.LastCalculatedAt
        };
    }

    public async Task<List<TrustScoreHistoryDto>> GetHistoryByUserAsync(long userId, int take = 10, CancellationToken cancellationToken = default)
    {
        var history = await _repo.GetHistoryByUserAsync(userId, take, cancellationToken);
        return history.Select(x => new TrustScoreHistoryDto
        {
            Score = x.Score,
            Tier = x.Tier,
            CompletedTrips = x.CompletedTrips,
            CancellationCount = x.CancellationCount,
            ReportCount = x.ReportCount,
            AverageRating = x.AverageRating,
            CalculatedAt = x.CalculatedAt
        }).ToList();
    }
}
