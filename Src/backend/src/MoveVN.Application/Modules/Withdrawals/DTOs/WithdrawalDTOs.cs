namespace MoveVN.Application.Modules.Withdrawals.DTOs;

public record WithdrawalRequestDto(
    long Id,
    long UserId,
    string? UserFullName,
    string? UserEmail,
    decimal Amount,
    string BankAccountNumber,
    string BankName,
    string BankAccountHolderName,
    string? BankBin,
    string Status,
    long? ProcessedBy,
    string? ProcessedByName,
    string? ProcessNote,
    string? ExternalTransactionRef,
    DateTime? ProcessedAt,
    DateTime CreatedAt
);

public record CreateWithdrawalRequest(decimal Amount);

public record ProcessWithdrawalRequest(string? Note, string? ExternalTransactionRef);

public record RejectWithdrawalRequest(string Reason);

public record WithdrawalListRequest(
    int Page = 1,
    int PageSize = 10,
    string? Status = null
);

public record UpdateBankAccountRequest(
    string BankAccountNumber,
    string BankName,
    string BankAccountHolderName,
    string? BankBin
);

public record VerifyBankAccountOtpRequest(
    string Otp,
    string BankAccountNumber,
    string BankName,
    string BankAccountHolderName,
    string? BankBin
);

public record OwnerBankDetailsDto(
    string? BankAccountNumber,
    string? BankName,
    string? BankAccountHolderName,
    string? BankBin
);
