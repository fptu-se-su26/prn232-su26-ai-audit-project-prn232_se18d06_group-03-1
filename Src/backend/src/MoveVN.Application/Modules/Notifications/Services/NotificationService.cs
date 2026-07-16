using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Notifications.Services;

public class NotificationService : INotificationService
{
    private const int MaxPageSize = 50;
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IUserRepository _userRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeDispatcher _realtimeDispatcher;
    private readonly IEmailSender _emailSender;

    public NotificationService(
        ICurrentUserContext currentUserContext,
        IUserRepository userRepository,
        INotificationRepository notificationRepository,
        INotificationRealtimeDispatcher realtimeDispatcher,
        IEmailSender emailSender)
    {
        _currentUserContext = currentUserContext;
        _userRepository = userRepository;
        _notificationRepository = notificationRepository;
        _realtimeDispatcher = realtimeDispatcher;
        _emailSender = emailSender;
    }

    public async Task<PagedResult<NotificationResponse>> GetMineAsync(bool? unreadOnly, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _notificationRepository.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == userId);

        if (unreadOnly == true)
        {
            query = query.Where(x => !x.IsRead);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => Map(x))
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<NotificationUnreadCountResponse> GetUnreadCountAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        return new NotificationUnreadCountResponse
        {
            UnreadCount = await GetUnreadCountAsync(userId, cancellationToken)
        };
    }

    public async Task<NotificationResponse> MarkAsReadAsync(long id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var notification = await _notificationRepository.GetByUserAsync(id, userId, cancellationToken)
            ?? throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _notificationRepository.SaveChangesAsync(cancellationToken);
            await _realtimeDispatcher.SendUnreadCountAsync(userId, await GetUnreadCountAsync(userId, cancellationToken), cancellationToken);
        }

        return Map(notification);
    }

    public async Task<MarkAllNotificationsReadResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;
        var unread = await _notificationRepository.Notifications
            .Where(x => x.UserId == userId && !x.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in unread)
        {
            notification.IsRead = true;
            notification.ReadAt = now;
        }

        if (unread.Count > 0)
        {
            await _notificationRepository.SaveChangesAsync(cancellationToken);
            await _realtimeDispatcher.SendUnreadCountAsync(userId, 0, cancellationToken);
        }

        return new MarkAllNotificationsReadResponse { UpdatedCount = unread.Count };
    }

    public async Task<NotificationResponse> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new AppException(ErrorCode.USER_NOT_FOUND);

        var now = DateTime.UtcNow;
        var notification = new Notification
        {
            UserId = user.Id,
            Type = request.Type.Trim(),
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
            DataJson = string.IsNullOrWhiteSpace(request.DataJson) ? null : request.DataJson.Trim(),
            Channel = string.IsNullOrWhiteSpace(request.Channel) ? "InApp" : request.Channel.Trim(),
            IsRead = false,
            SentAt = now,
            CreatedAt = now
        };

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _notificationRepository.SaveChangesAsync(cancellationToken);

        var response = Map(notification);
        await _realtimeDispatcher.SendCreatedAsync(user.Id, response, await GetUnreadCountAsync(user.Id, cancellationToken), cancellationToken);
        await SendEmailNotificationIfAllowedAsync(user, notification, cancellationToken);
        return response;
    }

    private long GetCurrentUserId()
    {
        return _currentUserContext.UserId
            ?? throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    private async Task<int> GetUnreadCountAsync(long userId, CancellationToken cancellationToken)
        => await _notificationRepository.Notifications.CountAsync(x => x.UserId == userId && !x.IsRead, cancellationToken);

    private async Task SendEmailNotificationIfAllowedAsync(User user, Notification notification, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            return;
        }

        var preference = await _notificationRepository.GetPreferenceByUserIdAsync(user.Id, cancellationToken);
        if (preference is { EmailEnabled: false })
        {
            return;
        }

        await _emailSender.SendNotificationAsync(
            user.Email,
            user.FullName,
            notification.Title,
            notification.Body,
            cancellationToken);
    }

    private static NotificationResponse Map(Notification notification)
        => new()
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Body = notification.Body,
            DataJson = notification.DataJson,
            Channel = notification.Channel,
            IsRead = notification.IsRead,
            ReadAt = notification.ReadAt,
            SentAt = notification.SentAt,
            CreatedAt = notification.CreatedAt
        };
}
