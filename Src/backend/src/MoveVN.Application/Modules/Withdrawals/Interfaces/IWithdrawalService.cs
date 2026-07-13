using MoveVN.Application.Modules.Withdrawals.DTOs;

namespace MoveVN.Application.Modules.Withdrawals.Interfaces;

public interface IWithdrawalService
{
    // Owner
    Task<WithdrawalRequestDto> CreateAsync(long userId, CreateWithdrawalRequest request, CancellationToken ct = default);
    Task<(List<WithdrawalRequestDto> Items, int TotalCount)> GetMyWithdrawalsAsync(long userId, WithdrawalListRequest request, CancellationToken ct = default);

    // Staff / Admin
    Task<(List<WithdrawalRequestDto> Items, int TotalCount)> GetAllWithdrawalsAsync(WithdrawalListRequest request, CancellationToken ct = default);
    Task<WithdrawalRequestDto> ApproveAsync(long withdrawalId, long staffId, ProcessWithdrawalRequest request, CancellationToken ct = default);
    Task<WithdrawalRequestDto> CompleteAsync(long withdrawalId, long staffId, ProcessWithdrawalRequest request, CancellationToken ct = default);
    Task<WithdrawalRequestDto> RejectAsync(long withdrawalId, long staffId, RejectWithdrawalRequest request, CancellationToken ct = default);

    // Bank Account OTP
    Task<OwnerBankDetailsDto> GetBankAccountAsync(long userId, CancellationToken ct = default);
    Task RequestBankAccountOtpAsync(long userId, CancellationToken ct = default);
    Task VerifyBankAccountOtpAsync(long userId, VerifyBankAccountOtpRequest request, CancellationToken ct = default);
}
