using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Application.Modules.Wallets.DTOs;
using MoveVN.Application.Modules.Wallets.Interfaces;
using MoveVN.Application.Common.Exceptions;

namespace MoveVN.Application.Modules.Wallets.Services;

public class WalletService : IWalletService
{
    private readonly IWalletRepository _walletRepo;
    private readonly MoveVN.Application.Interfaces.IUnitOfWork _unitOfWork;

    public WalletService(IWalletRepository walletRepo, MoveVN.Application.Interfaces.IUnitOfWork unitOfWork)
    {
        _walletRepo = walletRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<WalletDto> GetMyWalletAsync(long userId, CancellationToken cancellationToken = default)
    {
        var wallets = await _walletRepo.FindAsync(w => w.UserId == userId, cancellationToken);
        var wallet = wallets.FirstOrDefault();

        if (wallet == null)
        {
            // Auto create wallet for the user if they don't have one
            wallet = new Domain.Entities.Wallet
            {
                UserId = userId,
                Balance = 0,
                TotalEarned = 0,
                TotalSpent = 0
            };
            await _walletRepo.AddAsync(wallet, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            
            return new WalletDto(
                wallet.Id, userId, 0, 0, 0, DateTime.UtcNow
            );
        }

        return new WalletDto(
            wallet.Id,
            wallet.UserId,
            wallet.Balance,
            wallet.TotalEarned,
            wallet.TotalSpent,
            wallet.UpdatedAt
        );
    }

    public async Task<(List<WalletTransactionDto> Items, int TotalCount)> GetMyTransactionsAsync(long userId, WalletTransactionListRequest request, CancellationToken cancellationToken = default)
    {
        var wallets = await _walletRepo.FindAsync(w => w.UserId == userId, cancellationToken);
        var wallet = wallets.FirstOrDefault();

        if (wallet == null)
        {
            return (new List<WalletTransactionDto>(), 0);
        }

        var (items, totalCount) = await _walletRepo.GetTransactionsPagedAsync(wallet.Id, request.Page, request.PageSize, request.Type, cancellationToken);

        var dtos = items.Select(t => new WalletTransactionDto(
            t.Id,
            t.WalletId,
            t.Type,
            t.Amount,
            t.BalanceAfter,
            t.Note,
            t.CreatedAt
        )).ToList();

        return (dtos, totalCount);
    }
}
