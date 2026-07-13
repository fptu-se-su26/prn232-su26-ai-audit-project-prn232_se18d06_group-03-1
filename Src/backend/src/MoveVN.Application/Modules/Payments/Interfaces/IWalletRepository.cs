using MoveVN.Domain.Entities;
using System.Linq.Expressions;

namespace MoveVN.Application.Modules.Payments.Interfaces;

public interface IWalletRepository
{
    Task<Wallet?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Wallet>> FindAsync(Expression<Func<Wallet, bool>> predicate, CancellationToken cancellationToken = default);
    Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default);
    void Update(Wallet wallet);

    Task AddTransactionAsync(WalletTransaction transaction, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<WalletTransaction> Items, int TotalCount)> GetTransactionsPagedAsync(long walletId, int page, int pageSize, string? type = null, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<(Wallet Wallet, string UserFullName, string UserEmail)> Items, int TotalCount)> GetAllWalletsPagedAsync(int page, int pageSize, string? keyword = null, CancellationToken cancellationToken = default);
}
