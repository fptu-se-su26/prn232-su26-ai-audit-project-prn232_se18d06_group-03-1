using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/users/{userId:long}/sessions")]
public class UserSessionsController : BaseApiController
{
    private readonly ILoginSessionService _sessionService;

    public UserSessionsController(ILoginSessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LoginSessionResponse>>>> Get(
        long userId,
        CancellationToken cancellationToken)
    {
        var result = await _sessionService.GetAsync(userId, cancellationToken);
        return Success(result);
    }

    [HttpDelete("{sessionId}")]
    public async Task<ActionResult<ApiResponse<object>>> Revoke(
        long userId,
        string sessionId,
        CancellationToken cancellationToken)
    {
        await _sessionService.RevokeAsync(userId, sessionId, cancellationToken);
        return Success<object>(null, "Phiên đăng nhập đã được thu hồi.");
    }
}
