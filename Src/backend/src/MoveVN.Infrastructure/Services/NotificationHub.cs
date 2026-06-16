using Microsoft.Extensions.Logging;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class NotificationHub : INotificationHub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public Task SendToUserAsync(long userId, NotificationDto notification)
    {
        _logger.LogInformation(
            "SignalR notification to user {UserId}: {Title} - {Body}",
            userId, notification.Title, notification.Body);

        return Task.CompletedTask;
    }
}
