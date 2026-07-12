using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.AuditLogs.Interfaces;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Application.Modules.Wallets.DTOs;
using MoveVN.Application.Modules.Wallets.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Wallets.Services;

public class AdminWalletService : IAdminWalletService
{
    private readonly IWalletRepository _walletRepo;
    private readonly IUserRepository _userRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogService _auditLog;

    public AdminWalletService(IWalletRepository walletRepo, IUserRepository userRepo, IUnitOfWork unitOfWork, IAuditLogService auditLog)
    {
        _walletRepo = walletRepo;
        _userRepo = userRepo;
        _unitOfWork = unitOfWork;
        _auditLog = auditLog;
    }

    public async Task<(List<AdminWalletListItem> Items, int TotalCount)> GetAllWalletsAsync(int page, int pageSize, string? keyword, CancellationToken ct = default)
    {
        var (items, totalCount) = await _walletRepo.GetAllWalletsPagedAsync(page, pageSize, keyword, ct);

        var dtos = items.Select(x => new AdminWalletListItem(
            x.Wallet.Id, x.Wallet.UserId, x.UserFullName, x.UserEmail,
            x.Wallet.Balance, x.Wallet.TotalEarned, x.Wallet.TotalSpent, x.Wallet.UpdatedAt
        )).ToList();

        return (dtos, totalCount);
    }

    public async Task<AdminWalletDetail> GetWalletByUserIdAsync(long userId, int txPage, int txPageSize, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        var wallets = await _walletRepo.FindAsync(w => w.UserId == userId, ct);
        var wallet = wallets.FirstOrDefault()
            ?? throw new NotFoundException("Người dùng chưa có ví.");

        var (txItems, txTotalCount) = await _walletRepo.GetTransactionsPagedAsync(wallet.Id, txPage, txPageSize, null, ct);

        var walletDto = new WalletDto(wallet.Id, wallet.UserId, wallet.Balance, wallet.TotalEarned, wallet.TotalSpent, wallet.UpdatedAt);
        var txDtos = txItems.Select(t => new WalletTransactionDto(t.Id, t.WalletId, t.Type, t.Amount, t.BalanceAfter, t.Note, t.CreatedAt)).ToList();

        return new AdminWalletDetail(walletDto, user.FullName, user.Email, txDtos, txTotalCount);
    }

    public async Task<WalletDto> AdjustBalanceAsync(long userId, decimal amount, string note, long adminId, CancellationToken ct = default)
    {
        var wallets = await _walletRepo.FindAsync(w => w.UserId == userId, ct);
        var wallet = wallets.FirstOrDefault();

        if (wallet == null)
        {
            wallet = new Wallet { UserId = userId, Balance = 0, TotalEarned = 0, TotalSpent = 0 };
            await _walletRepo.AddAsync(wallet, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }

        var oldBalance = wallet.Balance;

        var tx = new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = WalletTransactionType.AdminAdjust,
            Amount = amount,
            BalanceAfter = wallet.Balance + amount,
            IdempotencyKey = $"admin_adjust_{adminId}_{DateTime.UtcNow.Ticks}",
            Note = note,
            Status = "Completed"
        };

        await _walletRepo.AddTransactionAsync(tx, ct);
        wallet.Balance += amount;

        if (amount > 0) wallet.TotalEarned += amount;
        else wallet.TotalSpent += Math.Abs(amount);

        _walletRepo.Update(wallet);
        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLog.LogAsync(adminId, "Admin", "Wallet.AdminAdjust", "Wallet", wallet.Id,
            new { OldBalance = oldBalance }, new { NewBalance = wallet.Balance, Amount = amount, Note = note }, ct: ct);

        return new WalletDto(wallet.Id, wallet.UserId, wallet.Balance, wallet.TotalEarned, wallet.TotalSpent, wallet.UpdatedAt);
    }
}
