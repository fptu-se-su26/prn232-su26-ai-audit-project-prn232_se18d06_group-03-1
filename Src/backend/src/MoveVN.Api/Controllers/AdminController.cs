using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : BaseApiController
{
    private readonly IAuthLogService _authLogService;
    private readonly IAdminUserService _adminUserService;
    private readonly IDashboardService _dashboardService;
    private readonly ISystemConfigService _systemConfigService;
    private readonly ICurrentUserContext _currentUser;

    public AdminController(
        IAuthLogService authLogService,
        IAdminUserService adminUserService,
        IDashboardService dashboardService,
        ISystemConfigService systemConfigService,
        ICurrentUserContext currentUser)
    {
        _authLogService = authLogService;
        _adminUserService = adminUserService;
        _dashboardService = dashboardService;
        _systemConfigService = systemConfigService;
        _currentUser = currentUser;
    }

    [HttpGet("auth-logs")]
    public async Task<ActionResult<ApiResponse<PagedResult<AuthLogDto>>>> GetAuthLogs(
        [FromQuery] AuthLogQueryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authLogService.GetLogsAsync(request, cancellationToken);
        return Ok(ApiResponse<PagedResult<AuthLogDto>>.Succeeded(result));
    }

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminUserDto>>>> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminUserService.GetUsersAsync(search, status, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminUserDto>>.Succeeded(result));
    }

    [HttpPut("users/{id:long}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserStatus(
        long id,
        UpdateUserStatusRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = _currentUser.DomainUserId!.Value;
        await _adminUserService.UpdateStatusAsync(id, request, adminId, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(null, "User status updated."));
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<DashboardKpiDto>>> GetDashboard(
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken cancellationToken)
    {
        var y = year ?? DateTime.UtcNow.Year;
        var m = month ?? DateTime.UtcNow.Month;
        var result = await _dashboardService.GetAdminKpiAsync(y, m, cancellationToken);
        return Ok(ApiResponse<DashboardKpiDto>.Succeeded(result));
    }

    [HttpGet("config")]
    public async Task<ActionResult<ApiResponse<List<SystemConfigDto>>>> GetConfig(CancellationToken cancellationToken)
    {
        var result = await _systemConfigService.GetAllAsync(cancellationToken);
        return Ok(ApiResponse<List<SystemConfigDto>>.Succeeded(result));
    }

    [HttpPut("config/{key}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateConfig(
        string key,
        UpdateSystemConfigRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = _currentUser.DomainUserId!.Value;
        await _systemConfigService.UpdateAsync(key, request, adminId, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(null, "Configuration updated."));
    }
}
