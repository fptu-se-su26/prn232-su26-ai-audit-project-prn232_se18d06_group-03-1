using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;
using System.Linq.Expressions;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class WalletRepository : IWalletRepository
{
    private readonly AppDbContext _context;

    public WalletRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default)
    {
        await _context.Wallets.AddAsync(wallet, cancellationToken);
    }

    public async Task AddTransactionAsync(WalletTransaction transaction, CancellationToken cancellationToken = default)
    {
        await _context.WalletTransactions.AddAsync(transaction, cancellationToken);
    }

    public Task<bool> TransactionExistsAsync(string idempotencyKey, CancellationToken cancellationToken = default)
        => _context.WalletTransactions.AnyAsync(transaction => transaction.IdempotencyKey == idempotencyKey, cancellationToken);

    public async Task<IReadOnlyList<Wallet>> FindAsync(Expression<Func<Wallet, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _context.Wallets.Where(predicate).ToListAsync(cancellationToken);
    }

    public async Task<Wallet?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _context.Wallets.FindAsync(new object[] { id }, cancellationToken);
    }

    public void Update(Wallet wallet)
    {
        _context.Wallets.Update(wallet);
    }

    public async Task<(IReadOnlyList<WalletTransaction> Items, int TotalCount)> GetTransactionsPagedAsync(long walletId, int page, int pageSize, string? type = null, CancellationToken cancellationToken = default)
    {
        var query = _context.WalletTransactions.Where(t => t.WalletId == walletId);
        
        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(t => t.Type == type);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<(Wallet Wallet, string UserFullName, string UserEmail)> Items, int TotalCount)> GetAllWalletsPagedAsync(
        int page, int pageSize, string? keyword = null, CancellationToken cancellationToken = default)
    {
        var query = from w in _context.Wallets
                    join u in _context.Users on w.UserId equals u.Id
                    select new { Wallet = w, u.FullName, u.Email };

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.ToLower();
            query = query.Where(x => x.FullName.ToLower().Contains(kw) || x.Email.ToLower().Contains(kw));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.Wallet.Balance)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var result = items.Select(x => (x.Wallet, x.FullName, x.Email)).ToList();
        return (result, totalCount);
    }
}
