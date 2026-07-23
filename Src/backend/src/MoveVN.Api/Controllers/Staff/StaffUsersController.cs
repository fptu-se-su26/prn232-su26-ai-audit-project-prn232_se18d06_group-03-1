using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;

namespace MoveVN.Api.Controllers.Staff;

[Authorize(Roles = "Staff")]
[Route("api/staff/users")]
public class StaffUsersController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase) { "Owner", "Customer" };

    public StaffUsersController(IAdminUserService adminUserService)
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
        if (!string.IsNullOrEmpty(role) && !AllowedRoles.Contains(role))
        {
            return BadRequest(ApiResponse<PagedResult<AdminUserListItem>>.Failed("400", "Nhân viên chỉ có thể quản lý chủ xe và khách hàng."));
        }

        if (string.IsNullOrEmpty(role))
        {
            role = null;
        }

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
            return NotFound(ApiResponse<AdminUserDetailDto>.Failed("404", "Không tìm thấy người dùng."));
        }

        var userRoles = result.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
        {
            return Forbid();
        }

        return Success(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUser(
        long id,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return NotFound(ApiResponse<object>.Failed("404", "Không tìm thấy người dùng."));
        }

        var userRoles = user.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
        {
            return Forbid();
        }

        await _adminUserService.UpdateUserAsync(id, request, cancellationToken);
        return Success<object>(null, "Cập nhật thông tin người dùng thành công.");
    }

    [HttpPatch("{id:long}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserStatus(
        long id,
        UpdateUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return NotFound(ApiResponse<object>.Failed("404", "Không tìm thấy người dùng."));
        }

        var userRoles = user.Roles.Select(r => r.ToString()).ToList();
        if (userRoles.All(r => !AllowedRoles.Contains(r)))
        {
            return Forbid();
        }

        await _adminUserService.UpdateUserStatusAsync(id, request, cancellationToken);
        return Success<object>(null, "Cập nhật trạng thái thành công.");
    }
}
