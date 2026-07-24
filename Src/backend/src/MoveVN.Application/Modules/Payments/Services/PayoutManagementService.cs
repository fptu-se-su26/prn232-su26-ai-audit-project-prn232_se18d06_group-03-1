using Microsoft.Extensions.Logging;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Payments.DTOs;
using MoveVN.Application.Modules.Payments.Interfaces;

namespace MoveVN.Application.Modules.Payments.Services;

public class PayoutManagementService : IPayoutManagementService
{
    private readonly IPayOsService _payOsService;
    private readonly ILogger<PayoutManagementService> _logger;

    public PayoutManagementService(IPayOsService payOsService, ILogger<PayoutManagementService> logger)
    {
        _payOsService = payOsService;
        _logger = logger;
    }

    public async Task<PayoutBalanceDto> GetPayoutBalanceAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching PayOS payout balance");
        var balance = await _payOsService.GetPayoutBalanceAsync();
        return new PayoutBalanceDto(balance);
    }

    public async Task<PayoutStatusDto> GetPayoutStatusAsync(string payoutId, CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching PayOS payout status for PayoutId={PayoutId}", payoutId);
        var info = await _payOsService.GetPayoutInfoAsync(payoutId);
        return new PayoutStatusDto(info.PayoutId, info.State, info.Amount);
    }
}
