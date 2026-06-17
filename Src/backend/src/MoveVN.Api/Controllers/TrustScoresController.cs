using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/trust-scores")]
public class TrustScoresController : BaseApiController
{
    private readonly ITrustScoreService _trustScoreService;
    private readonly ICurrentUserContext _currentUser;

    public TrustScoresController(ITrustScoreService trustScoreService, ICurrentUserContext currentUser)
    {
        _trustScoreService = trustScoreService;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<TrustScoreDto?>>> GetMine(CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _trustScoreService.GetByUserAsync(userId, cancellationToken);
        return Ok(ApiResponse<TrustScoreDto?>.Succeeded(result));
    }

    [HttpGet("me/history")]
    public async Task<ActionResult<ApiResponse<List<TrustScoreHistoryDto>>>> GetMyHistory(
        [FromQuery] int take = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _trustScoreService.GetHistoryByUserAsync(userId, take, cancellationToken);
        return Ok(ApiResponse<List<TrustScoreHistoryDto>>.Succeeded(result));
    }
}
