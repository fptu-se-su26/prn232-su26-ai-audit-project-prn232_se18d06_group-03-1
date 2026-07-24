using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Payments.DTOs;
using MoveVN.Application.Modules.Payments.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
public class PayoutsController : BaseApiController
{
    private readonly IPayoutManagementService _payoutService;

    public PayoutsController(IPayoutManagementService payoutService)
    {
        _payoutService = payoutService;
    }

    /// <summary>
    /// Lấy số dư ví chi hộ PayOS.
    /// </summary>
    [HttpGet("balance")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<ApiResponse<PayoutBalanceDto>>> GetBalance(CancellationToken ct)
    {
        var result = await _payoutService.GetPayoutBalanceAsync(ct);
        return Success(result, "Lấy số dư ví chi hộ thành công.");
    }

    /// <summary>
    /// Tra cứu trạng thái lô chi hộ theo PayOS Payout ID.
    /// </summary>
    [HttpGet("{payoutId}/status")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<ApiResponse<PayoutStatusDto>>> GetStatus(
        string payoutId, CancellationToken ct)
    {
        var result = await _payoutService.GetPayoutStatusAsync(payoutId, ct);
        return Success(result, "Lấy trạng thái chi hộ thành công.");
    }
}
