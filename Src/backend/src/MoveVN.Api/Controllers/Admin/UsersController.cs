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

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<AdminUserDetailDto>>> GetUserById(
        long id,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound(Application.Common.Models.ApiResponse<AdminUserDetailDto>.Failed("404", "Không tìm thấy người dùng."));
        }
        return Success(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUser(
        long id,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        await _adminUserService.UpdateUserAsync(id, request, cancellationToken);
        return Success<object>(null, "Cập nhật thông tin người dùng thành công.");
    }

    [HttpPatch("{id:long}/roles")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserRole(
        long id,
        UpdateUserRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        await _adminUserService.UpdateUserRoleAsync(id, request, cancellationToken);
        return Success<object>(null, "Cập nhật vai trò thành công.");
    }

    [HttpPatch("{id:long}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserStatus(
        long id,
        UpdateUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await _adminUserService.UpdateUserStatusAsync(id, request, cancellationToken);
        return Success<object>(null, "Cập nhật trạng thái thành công.");
    }
}
