using MoveVN.Application.Modules.Wallets.DTOs;

namespace MoveVN.Application.Modules.Wallets.Interfaces;

public interface IAdminWalletService
{
    Task<(List<AdminWalletListItem> Items, int TotalCount)> GetAllWalletsAsync(int page, int pageSize, string? keyword, CancellationToken ct = default);
    Task<AdminWalletDetail> GetWalletByUserIdAsync(long userId, int txPage, int txPageSize, CancellationToken ct = default);
    Task<WalletDto> AdjustBalanceAsync(long userId, decimal amount, string note, long adminId, CancellationToken ct = default);
}
