using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Modules.Wallets.Interfaces;
using MoveVN.Application.Modules.Wallets.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WalletsController : BaseApiController
{
    private readonly IWalletService _walletService;
    private readonly ICurrentUserContext _currentUser;

    public WalletsController(IWalletService walletService, ICurrentUserContext currentUser)
    {
        _walletService = walletService;
        _currentUser = currentUser;
    }

    [HttpGet("my-wallet")]
    public async Task<ActionResult<MoveVN.Application.Common.Models.ApiResponse<WalletDto>>> GetMyWallet(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var wallet = await _walletService.GetMyWalletAsync(userId, cancellationToken);
        return Success(wallet);
    }

    [HttpGet("my-transactions")]
    public async Task<ActionResult<MoveVN.Application.Common.Models.ApiResponse<object>>> GetMyTransactions([FromQuery] WalletTransactionListRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var (items, totalCount) = await _walletService.GetMyTransactionsAsync(userId, request, cancellationToken);
        return Success<object>(new { items, totalCount, page = request.Page, pageSize = request.PageSize });
    }
}
