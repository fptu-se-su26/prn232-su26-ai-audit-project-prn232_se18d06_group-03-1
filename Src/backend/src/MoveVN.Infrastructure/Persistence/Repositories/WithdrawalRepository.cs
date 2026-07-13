using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Withdrawals.Interfaces;
using MoveVN.Domain.Entities;
using System.Linq.Expressions;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class WithdrawalRepository : IWithdrawalRepository
{
    private readonly AppDbContext _context;

    public WithdrawalRepository(AppDbContext context) => _context = context;

    public async Task<WithdrawalRequest?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _context.WithdrawalRequests.FindAsync(new object[] { id }, ct);

    public async Task<IReadOnlyList<WithdrawalRequest>> FindAsync(Expression<Func<WithdrawalRequest, bool>> predicate, CancellationToken ct = default)
        => await _context.WithdrawalRequests.Where(predicate).ToListAsync(ct);

    public async Task AddAsync(WithdrawalRequest request, CancellationToken ct = default)
        => await _context.WithdrawalRequests.AddAsync(request, ct);

    public void Update(WithdrawalRequest request)
        => _context.WithdrawalRequests.Update(request);

    public async Task<(IReadOnlyList<WithdrawalRequest> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, string? status = null, long? userId = null, CancellationToken ct = default)
    {
        var query = _context.WithdrawalRequests.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(w => w.Status == status);

        if (userId.HasValue)
            query = query.Where(w => w.UserId == userId.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(w => w.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
