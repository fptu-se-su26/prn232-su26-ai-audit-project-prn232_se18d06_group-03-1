using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/auth/sessions")]
public class LoginSessionsController : BaseApiController
{
    private readonly ILoginSessionService _sessionService;
    private readonly ICurrentUserContext _currentUser;

    public LoginSessionsController(ILoginSessionService sessionService, ICurrentUserContext currentUser)
    {
        _sessionService = sessionService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LoginSessionResponse>>>> Get(CancellationToken cancellationToken)
    {
        var result = await _sessionService.GetAsync(_currentUser.UserId!.Value, cancellationToken);
        return Success(result);
    }

    [HttpDelete("{sessionId}")]
    public async Task<ActionResult<ApiResponse<object>>> Revoke(string sessionId, CancellationToken cancellationToken)
    {
        await _sessionService.RevokeAsync(_currentUser.UserId!.Value, sessionId, cancellationToken);
        return Success<object>(null, "Phiên đăng nhập đã được thu hồi.");
    }

    [HttpDelete("others")]
    public async Task<ActionResult<ApiResponse<object>>> RevokeOthers(
        [FromQuery] string currentSessionId,
        CancellationToken cancellationToken)
    {
        await _sessionService.RevokeOthersAsync(_currentUser.UserId!.Value, currentSessionId, cancellationToken);
        return Success<object>(null, "Các phiên đăng nhập khác đã được thu hồi.");
    }
}
