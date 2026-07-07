using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/notifications")]
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationResponse>>>> GetMine(
        [FromQuery] bool? unreadOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Success(await _notificationService.GetMineAsync(unreadOnly, page, pageSize, cancellationToken));

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<NotificationUnreadCountResponse>>> GetUnreadCount(CancellationToken cancellationToken = default)
        => Success(await _notificationService.GetUnreadCountAsync(cancellationToken));

    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<NotificationResponse>>> MarkAsRead(long id, CancellationToken cancellationToken = default)
        => Success(await _notificationService.MarkAsReadAsync(id, cancellationToken));

    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<MarkAllNotificationsReadResponse>>> MarkAllAsRead(CancellationToken cancellationToken = default)
        => Success(await _notificationService.MarkAllAsReadAsync(cancellationToken));
}
