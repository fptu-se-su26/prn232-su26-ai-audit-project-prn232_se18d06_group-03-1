using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.System;

public class TrustScoreRepository : ITrustScoreRepository
{
    private readonly AppDbContext _context;

    public TrustScoreRepository(AppDbContext context) => _context = context;

    public async Task<TrustScore?> GetByUserAsync(long userId, CancellationToken ct = default)
        => await _context.TrustScores.FirstOrDefaultAsync(t => t.UserId == userId, ct);

    public async Task<List<TrustScoreHistory>> GetHistoryByUserAsync(long userId, int take = 10, CancellationToken ct = default)
        => await _context.TrustScoreHistories
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CalculatedAt)
            .Take(take)
            .ToListAsync(ct);

    public async Task AddAsync(TrustScore ts, CancellationToken ct = default)
        => await _context.TrustScores.AddAsync(ts, ct);

    public async Task AddHistoryAsync(TrustScoreHistory history, CancellationToken ct = default)
        => await _context.TrustScoreHistories.AddAsync(history, ct);

    public void Update(TrustScore ts) => _context.TrustScores.Update(ts);

    public async Task<List<(long userId, int completed, int cancelled, int reported, decimal? avgRating)>> GetAllUsersWithStatsAsync(CancellationToken ct = default)
    {
        var users = await _context.Users.ToListAsync(ct);
        var result = new List<(long, int, int, int, decimal?)>();
        foreach (var user in users)
        {
            var completed = await _context.Bookings.CountAsync(b => b.CustomerId == user.Id && b.Status == "Completed", ct);
            var cancelled = await _context.Bookings.CountAsync(b => b.CustomerId == user.Id && b.Status == "Cancelled", ct);
            var bookingIds = await _context.Bookings.Where(b => b.CustomerId == user.Id).Select(b => b.Id).ToListAsync(ct);
            var reported = await _context.Disputes.CountAsync(d => bookingIds.Contains(d.BookingId), ct);
            var avgRating = await _context.Reviews.Where(r => r.RevieweeId == user.Id).AverageAsync(r => (decimal?)r.Rating, ct);
            result.Add((user.Id, completed, cancelled, reported, avgRating));
        }
        return result;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
