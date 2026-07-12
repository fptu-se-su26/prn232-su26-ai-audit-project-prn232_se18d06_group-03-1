using MoveVN.Application.Modules.Wallets.DTOs;

namespace MoveVN.Application.Modules.Wallets.Interfaces;

public interface IWalletService
{
    Task<WalletDto> GetMyWalletAsync(long userId, CancellationToken cancellationToken = default);
    Task<(List<WalletTransactionDto> Items, int TotalCount)> GetMyTransactionsAsync(long userId, WalletTransactionListRequest request, CancellationToken cancellationToken = default);
}
