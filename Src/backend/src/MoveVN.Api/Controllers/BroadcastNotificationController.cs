using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Admin,Staff")]
[Route("api/notifications/broadcast")]
public class BroadcastNotificationController : BaseApiController
{
    private readonly INotificationService _notificationService;

    public BroadcastNotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<BroadcastNotificationResponse>>> Broadcast(
        [FromBody] BroadcastNotificationRequest request,
        CancellationToken cancellationToken = default)
        => Success(await _notificationService.BroadcastAsync(request, cancellationToken));
}
