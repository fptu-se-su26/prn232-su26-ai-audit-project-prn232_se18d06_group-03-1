using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/notifications")]
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserContext _currentUser;

    public NotificationsController(INotificationService notificationService, ICurrentUserContext currentUser)
    {
        _notificationService = notificationService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> GetMyNotifications(
        [FromQuery] bool? unread,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _notificationService.GetMyNotificationsAsync(userId, unread, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<NotificationDto>>.Succeeded(result));
    }

    [HttpPut("{id:long}/read")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(
        long id,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        await _notificationService.MarkAsReadAsync(id, userId, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(null, "Notification marked as read."));
    }

    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(null, "All notifications marked as read."));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount(CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _notificationService.GetUnreadCountAsync(userId, cancellationToken);
        return Ok(ApiResponse<int>.Succeeded(result));
    }
}
