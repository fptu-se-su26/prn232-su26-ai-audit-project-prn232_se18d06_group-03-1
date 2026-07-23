using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Api.Controllers.Staff;

[Authorize(Roles = "Staff")]
[Route("api/staff/users/{userId:long}/sessions")]
public class StaffUserSessionsController : BaseApiController
{
    private readonly ILoginSessionService _sessionService;
    private readonly IAdminUserService _adminUserService;
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase) { "Owner", "Customer" };

    public StaffUserSessionsController(ILoginSessionService sessionService, IAdminUserService adminUserService)
    {
        _sessionService = sessionService;
        _adminUserService = adminUserService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LoginSessionResponse>>>> Get(
        long userId,
        CancellationToken cancellationToken)
    {
        var user = await _adminUserService.GetUserByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return NotFound(ApiResponse<IReadOnlyList<LoginSessionResponse>>.Failed("404", "Không tìm thấy người dùng."));
        }

        var userRoles = user.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
        {
            return Forbid();
        }

        var result = await _sessionService.GetAsync(userId, cancellationToken);
        return Success(result);
    }

    [HttpDelete("{sessionId}")]
    public async Task<ActionResult<ApiResponse<object>>> Revoke(
        long userId,
        string sessionId,
        CancellationToken cancellationToken)
    {
        var user = await _adminUserService.GetUserByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return NotFound(ApiResponse<object>.Failed("404", "Không tìm thấy người dùng."));
        }

        var userRoles = user.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
        {
            return Forbid();
        }

        await _sessionService.RevokeAsync(userId, sessionId, cancellationToken);
        return Success<object>(null, "Phiên đăng nhập đã được thu hồi.");
    }
}
