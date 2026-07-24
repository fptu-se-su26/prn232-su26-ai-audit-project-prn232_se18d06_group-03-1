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

public class CreateWithdrawalRequest
{
    public decimal Amount { get; set; }
}

public class ProcessWithdrawalRequest
{
    public string? Note { get; set; }
    public string? ExternalTransactionRef { get; set; }
}

public class RejectWithdrawalRequest
{
    public string Reason { get; set; } = "";
}

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

public class VerifyBankAccountOtpRequest
{
    public string Otp { get; set; } = "";
    public string BankAccountNumber { get; set; } = "";
    public string BankName { get; set; } = "";
    public string BankAccountHolderName { get; set; } = "";
    public string? BankBin { get; set; }
}

public record OwnerBankDetailsDto(
    string? BankAccountNumber,
    string? BankName,
    string? BankAccountHolderName,
    string? BankBin
);
