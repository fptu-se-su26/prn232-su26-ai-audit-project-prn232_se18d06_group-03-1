using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/users")]
public class UsersController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;

    public UsersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminUserListItem>>>> GetUsers(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] bool? isOnline,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminUserService.GetUsersAsync(keyword, sortBy, role, status, isOnline, page, pageSize, cancellationToken);
        return Success(result);
    }
}
