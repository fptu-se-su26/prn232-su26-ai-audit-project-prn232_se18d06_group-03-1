using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.UserManagementAuditLog.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/users")]
public class UsersController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;
    private readonly IUserManagementAuditLogService _auditLog;
    private readonly ICurrentUserContext _currentUser;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private string? _cachedActorName;

    public UsersController(
        IAdminUserService adminUserService,
        IUserManagementAuditLogService auditLog,
        ICurrentUserContext currentUser,
        IHttpContextAccessor httpContextAccessor)
    {
        _adminUserService = adminUserService;
        _auditLog = auditLog;
        _currentUser = currentUser;
        _httpContextAccessor = httpContextAccessor;
    }

    private string GetClientIp()
    {
        return _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "";
    }

    private async Task<string> GetActorNameAsync(CancellationToken ct)
    {
        if (_cachedActorName != null) return _cachedActorName;
        var actorId = _currentUser.UserId;
        if (actorId == null) return "Unknown";
        var actor = await _adminUserService.GetUserByIdAsync(actorId.Value, ct);
        _cachedActorName = actor?.FullName ?? "Unknown";
        return _cachedActorName;
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

    [HttpGet("{id:long}/logs")]
    public async Task<ActionResult<ApiResponse<List<UserManagementAuditLogItem>>>> GetLogs(
        long id,
        CancellationToken cancellationToken = default)
    {
        var result = await _auditLog.GetByTargetUserIdAsync(id, 50, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUser(
        long id,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        var oldValue = user != null ? System.Text.Json.JsonSerializer.Serialize(new { user.FullName, Phone = user.Phone }) : null;

        await _adminUserService.UpdateUserAsync(id, request, cancellationToken);

        var newValue = System.Text.Json.JsonSerializer.Serialize(new { request.FullName, request.Phone });
        await _auditLog.LogAsync(
            _currentUser.UserId ?? 0, await GetActorNameAsync(cancellationToken), "Admin",
            "UpdateInfo", id, user?.FullName ?? "",
            oldValue, newValue, GetClientIp(), cancellationToken);

        return Success<object>(null, "Cập nhật thông tin người dùng thành công.");
    }

    [HttpPatch("{id:long}/roles")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserRole(
        long id,
        UpdateUserRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);

        await _adminUserService.UpdateUserRoleAsync(id, request, cancellationToken);

        var actionName = request.Assigned ? "AssignRole" : "RemoveRole";
        await _auditLog.LogAsync(
            _currentUser.UserId ?? 0, await GetActorNameAsync(cancellationToken), "Admin",
            actionName, id, user?.FullName ?? "",
            null, request.Role, GetClientIp(), cancellationToken);

        return Success<object>(null, "Cập nhật vai trò thành công.");
    }

    [HttpPatch("{id:long}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserStatus(
        long id,
        UpdateUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        var oldStatus = user?.Status;

        await _adminUserService.UpdateUserStatusAsync(id, request, cancellationToken);

        var actionName = request.Status switch
        {
            "Suspended" => "SuspendUser",
            "Active" when oldStatus == "Suspended" => "ActivateUser",
            "Deleted" => "DeleteUser",
            "Active" when oldStatus == "Deleted" => "RestoreUser",
            _ => "ChangeStatus"
        };

        await _auditLog.LogAsync(
            _currentUser.UserId ?? 0, await GetActorNameAsync(cancellationToken), "Admin",
            actionName, id, user?.FullName ?? "",
            oldStatus, request.Status, GetClientIp(), cancellationToken);

        return Success<object>(null, "Cập nhật trạng thái thành công.");
    }
}