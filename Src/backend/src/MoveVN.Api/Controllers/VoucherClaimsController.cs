using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.VoucherClaims.DTOs;
using MoveVN.Application.Modules.VoucherClaims.Interfaces;

namespace MoveVN.Api.Controllers;

[ApiController]
[Route("api/voucher-claims")]
[Authorize(Roles = "Customer")]
public class VoucherClaimsController : ControllerBase
{
    private readonly IVoucherClaimService _svc;
    private readonly ICurrentUserContext _currentUser;

    public VoucherClaimsController(IVoucherClaimService svc, ICurrentUserContext currentUser)
    {
        _svc = svc;
        _currentUser = currentUser;
    }

    private long GetUserId() => _currentUser.UserId ?? 0;

    [HttpGet("hunt")]
    public async Task<ActionResult<ApiResponse<List<VoucherHuntItem>>>> Hunt(CancellationToken ct)
    {
        var result = await _svc.GetAvailableVouchersAsync(GetUserId(), ct);
        return Ok(ApiResponse<List<VoucherHuntItem>>.Succeeded(result));
    }

    [HttpGet("wallet")]
    public async Task<ActionResult<ApiResponse<List<VoucherClaimResponse>>>> Wallet(CancellationToken ct)
    {
        var result = await _svc.GetMyWalletAsync(GetUserId(), ct);
        return Ok(ApiResponse<List<VoucherClaimResponse>>.Succeeded(result));
    }

    [HttpPost("{promotionId:long}/claim")]
    public async Task<ActionResult<ApiResponse<VoucherClaimResponse>>> Claim(long promotionId, CancellationToken ct)
    {
        var result = await _svc.ClaimVoucherAsync(GetUserId(), promotionId, ct);
        return Ok(ApiResponse<VoucherClaimResponse>.Succeeded(result));
    }
}
