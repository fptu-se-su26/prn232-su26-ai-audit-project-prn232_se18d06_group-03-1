using MoveVN.Application.Modules.Payments.DTOs;

namespace MoveVN.Application.Modules.Payments.Interfaces;

public interface IPayoutManagementService
{
    /// <summary>
    /// Gets the current PayOS payout account balance.
    /// </summary>
    Task<PayoutBalanceDto> GetPayoutBalanceAsync(CancellationToken ct = default);

    /// <summary>
    /// Gets the status of a specific payout by its PayOS Payout ID.
    /// </summary>
    Task<PayoutStatusDto> GetPayoutStatusAsync(string payoutId, CancellationToken ct = default);
}
