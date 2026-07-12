using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Wallets.DTOs;

public record WalletDto(
    long Id,
    long UserId,
    decimal Balance,
    decimal TotalEarned,
    decimal TotalSpent,
    DateTime UpdatedAt
);

public record WalletTransactionDto(
    long Id,
    long WalletId,
    string Type,
    decimal Amount,
    decimal BalanceAfter,
    string? Note,
    DateTime CreatedAt
);

public record WalletTransactionListRequest(
    int Page = 1,
    int PageSize = 10,
    string? Type = null
);

public record AdminWalletListItem(
    long WalletId,
    long UserId,
    string UserFullName,
    string UserEmail,
    decimal Balance,
    decimal TotalEarned,
    decimal TotalSpent,
    DateTime UpdatedAt
);

public record AdminWalletDetail(
    WalletDto Wallet,
    string UserFullName,
    string UserEmail,
    List<WalletTransactionDto> Transactions,
    int TransactionTotalCount
);

public record AdjustBalanceRequest(decimal Amount, string Note);

