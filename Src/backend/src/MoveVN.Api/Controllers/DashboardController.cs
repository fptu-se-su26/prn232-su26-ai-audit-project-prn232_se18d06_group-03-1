using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Owner")]
[Route("api/dashboard")]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _dashboardService;
    private readonly ICurrentUserContext _currentUser;

    public DashboardController(IDashboardService dashboardService, ICurrentUserContext currentUser)
    {
        _dashboardService = dashboardService;
        _currentUser = currentUser;
    }

    [HttpGet("owner")]
    public async Task<ActionResult<ApiResponse<List<DailyBookingDto>>>> GetOwnerDashboard(
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.DomainUserId!.Value;
        var y = year ?? DateTime.UtcNow.Year;
        var m = month ?? DateTime.UtcNow.Month;
        var result = await _dashboardService.GetOwnerRevenueAsync(ownerId, y, m, cancellationToken);
        return Ok(ApiResponse<List<DailyBookingDto>>.Succeeded(result));
    }
}
