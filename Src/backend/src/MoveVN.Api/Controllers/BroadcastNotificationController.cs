using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Admin,Staff")]
[Route("api/notifications/broadcast")]
public class BroadcastNotificationController : BaseApiController
{
    private readonly INotificationService _notificationService;
    private readonly IBroadcastNotificationLogService _logService;

    public BroadcastNotificationController(INotificationService notificationService, IBroadcastNotificationLogService logService)
    {
        _notificationService = notificationService;
        _logService = logService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<BroadcastNotificationResponse>>> Broadcast(
        [FromBody] BroadcastNotificationRequest request,
        CancellationToken cancellationToken = default)
        => Success(await _notificationService.BroadcastAsync(request, cancellationToken));

    [HttpGet("logs")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PagedResult<BroadcastNotificationLogResponse>>>> GetLogs(
        [FromQuery] string? keyword,
        [FromQuery] string? channel,
        [FromQuery] string? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Success(await _logService.GetLogsAsync(
            keyword, channel, status, fromDate, toDate,
            Math.Max(page, 1), Math.Clamp(pageSize, 1, 50), cancellationToken));
}
