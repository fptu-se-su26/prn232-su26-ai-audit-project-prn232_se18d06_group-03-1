using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Wallets.DTOs;
using MoveVN.Application.Modules.Wallets.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Admin,Staff")]
[ApiController]
[Route("api/admin/wallets")]
public class AdminWalletsController : BaseApiController
{
    private readonly IAdminWalletService _service;
    private readonly ICurrentUserContext _currentUser;

    public AdminWalletsController(IAdminWalletService service, ICurrentUserContext currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAllWallets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null,
        CancellationToken ct = default)
    {
        var (items, totalCount) = await _service.GetAllWalletsAsync(page, pageSize, keyword, ct);
        return Success<object>(new { items, totalCount, page, pageSize });
    }

    [HttpGet("{userId:long}")]
    public async Task<ActionResult<ApiResponse<AdminWalletDetail>>> GetWalletByUserId(
        long userId,
        [FromQuery] int txPage = 1,
        [FromQuery] int txPageSize = 20,
        CancellationToken ct = default)
    {
        var detail = await _service.GetWalletByUserIdAsync(userId, txPage, txPageSize, ct);
        return Success(detail);
    }

    [HttpPost("{userId:long}/adjust")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<WalletDto>>> AdjustBalance(
        long userId, [FromBody] AdjustBalanceRequest request, CancellationToken ct)
    {
        var adminId = _currentUser.UserId!.Value;
        var wallet = await _service.AdjustBalanceAsync(userId, request.Amount, request.Note, adminId, ct);
        return Success(wallet, "Đã điều chỉnh số dư.");
    }
}
