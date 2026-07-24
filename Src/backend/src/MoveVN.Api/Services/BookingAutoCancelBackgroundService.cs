using System.Text.Json;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.SystemConfigs.DTOs;
using MoveVN.Application.Modules.SystemConfigs.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Api.Services;

public class BookingAutoCancelBackgroundService : BackgroundService
{
    private static readonly TimeSpan DefaultScanInterval = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan DefaultPendingTimeout = TimeSpan.FromHours(24);
    private const int DefaultBatchSize = 50;

    private readonly IConfiguration _configuration;
    private readonly ILogger<BookingAutoCancelBackgroundService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public BookingAutoCancelBackgroundService(
        IConfiguration configuration,
        ILogger<BookingAutoCancelBackgroundService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!GetBool("BOOKING_AUTO_CANCEL_ENABLED", "BookingAutoCancel:Enabled", true))
        {
            _logger.LogInformation("Booking auto-cancel background service is disabled.");
            return;
        }

        await RunSafelyAsync(stoppingToken);

        using var timer = new PeriodicTimer(GetScanInterval());
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await RunSafelyAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Normal host shutdown.
        }
    }

    private async Task RunSafelyAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var systemConfig = scope.ServiceProvider.GetRequiredService<ISystemConfigService>();
            var enabled = await systemConfig.GetBoolAsync(
                SystemConfigKeys.BookingAutoCancelEnabled,
                GetBool("BOOKING_AUTO_CANCEL_ENABLED", "BookingAutoCancel:Enabled", true),
                cancellationToken);

            if (!enabled)
            {
                return;
            }

            await AutoCancelExpiredPendingBookingsAsync(scope.ServiceProvider, systemConfig, cancellationToken);
            await AutoCancelExpiredApprovedBookingsAsync(scope.ServiceProvider, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Booking auto-cancel job failed.");
        }
    }

    private async Task AutoCancelExpiredApprovedBookingsAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken)
    {
        var bookingRepository = serviceProvider.GetRequiredService<IBookingRepository>();
        var notificationService = serviceProvider.GetRequiredService<INotificationService>();
        var now = DateTime.UtcNow;
        var expiredBookings = (await bookingRepository.GetExpiredApprovedAsync(now, cancellationToken))
            .Take(GetBatchSize())
            .ToList();

        foreach (var booking in expiredBookings)
        {
            const string reason = "Khach hang khong thanh toan tien coc dung han. He thong tu dong huy booking.";
            booking.Status = "Cancelled";
            booking.CancelReason = reason;
            booking.CancelledAt = now;
            booking.UpdatedAt = now;
            booking.CancellationSource = "PaymentTimeout";
            bookingRepository.Update(booking);
            await bookingRepository.AddStatusHistoryAsync(new BookingStatusHistory
            {
                BookingId = booking.Id,
                FromStatus = "Approved",
                ToStatus = "Cancelled",
                Note = reason,
                CreatedAt = now
            }, cancellationToken);
        }

        if (expiredBookings.Count == 0) return;
        await bookingRepository.SaveChangesAsync(cancellationToken);
        foreach (var booking in expiredBookings)
        {
            await NotifyBookingAutoRejectedAsync(notificationService, booking, booking.CustomerId, "customer", cancellationToken);
            if (booking.OwnerId != booking.CustomerId)
                await NotifyBookingAutoRejectedAsync(notificationService, booking, booking.OwnerId, "owner", cancellationToken);
        }
        _logger.LogInformation("Auto-cancelled {Count} approved booking(s) after deposit deadline.", expiredBookings.Count);
    }

    private async Task AutoCancelExpiredPendingBookingsAsync(
        IServiceProvider serviceProvider,
        ISystemConfigService systemConfig,
        CancellationToken cancellationToken)
    {
        var bookingRepository = serviceProvider.GetRequiredService<IBookingRepository>();
        var notificationService = serviceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;
        var pendingTimeout = await GetPendingTimeoutAsync(systemConfig, cancellationToken);
        var threshold = now.Subtract(pendingTimeout);
        var batchSize = GetBatchSize();

        var expiredBookings = (await bookingRepository.GetExpiredPendingAsync(threshold, cancellationToken))
            .Take(batchSize)
            .ToList();

        if (expiredBookings.Count == 0)
        {
            return;
        }

        foreach (var booking in expiredBookings)
        {
            var previousStatus = booking.Status;
            var reason = $"Chủ xe không phản hồi trong {pendingTimeout.TotalHours:0} giờ. Hệ thống tự động từ chối booking.";

            booking.Status = "Rejected";
            booking.CancelReason = reason;
            booking.CancelledAt = now;
            booking.UpdatedAt = now;

            bookingRepository.Update(booking);
            await bookingRepository.AddStatusHistoryAsync(new BookingStatusHistory
            {
                BookingId = booking.Id,
                FromStatus = previousStatus,
                ToStatus = "Rejected",
                ChangedBy = null,
                Note = reason,
                CreatedAt = now
            }, cancellationToken);
        }

        await bookingRepository.SaveChangesAsync(cancellationToken);

        foreach (var booking in expiredBookings)
        {
            await NotifyBookingAutoRejectedAsync(notificationService, booking, booking.CustomerId, "customer", cancellationToken);

            if (booking.OwnerId != booking.CustomerId)
            {
                await NotifyBookingAutoRejectedAsync(notificationService, booking, booking.OwnerId, "owner", cancellationToken);
            }
        }

        _logger.LogInformation("Auto-rejected {Count} pending booking(s) without an owner response.", expiredBookings.Count);
    }

    private async Task NotifyBookingAutoRejectedAsync(
        INotificationService notificationService,
        Booking booking,
        long userId,
        string roleTarget,
        CancellationToken cancellationToken)
    {
        try
        {
            await notificationService.CreateAsync(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "Booking",
                Title = booking.Status == "Rejected"
                    ? "Booking đã tự động bị từ chối"
                    : "Booking đã tự động bị hủy",
                Body = $"{booking.BookingCode}: {booking.CancelReason}",
                DataJson = JsonSerializer.Serialize(new
                {
                    bookingId = booking.Id,
                    bookingCode = booking.BookingCode,
                    vehicleId = booking.VehicleId,
                    status = booking.Status,
                    roleTarget,
                    targetPath = roleTarget == "owner"
                        ? $"/owner/bookings/{booking.Id}"
                        : $"/customer/bookings/{booking.Id}",
                    action = booking.Status == "Rejected" ? "BookingAutoRejected" : "BookingAutoCancelled"
                }),
                Channel = "InApp"
            }, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogWarning(exception, "Failed to send auto-reject notification for booking {BookingId} to user {UserId}.", booking.Id, userId);
        }
    }

    private TimeSpan GetScanInterval()
    {
        var seconds = GetPositiveInt("BOOKING_AUTO_CANCEL_INTERVAL_SECONDS", "BookingAutoCancel:IntervalSeconds");
        return seconds.HasValue ? TimeSpan.FromSeconds(seconds.Value) : DefaultScanInterval;
    }

    private TimeSpan GetPendingTimeout()
    {
        var minutes = GetPositiveInt("BOOKING_AUTO_CANCEL_PENDING_MINUTES", "BookingAutoCancel:PendingMinutes");
        return minutes.HasValue ? TimeSpan.FromMinutes(minutes.Value) : DefaultPendingTimeout;
    }

    private async Task<TimeSpan> GetPendingTimeoutAsync(ISystemConfigService systemConfig, CancellationToken cancellationToken)
    {
        var hours = await systemConfig.GetIntAsync(SystemConfigKeys.AutoCancelHours, (int)DefaultPendingTimeout.TotalHours, cancellationToken);
        return TimeSpan.FromHours(Math.Max(1, hours));
    }

    private int GetBatchSize()
        => GetPositiveInt("BOOKING_AUTO_CANCEL_BATCH_SIZE", "BookingAutoCancel:BatchSize") ?? DefaultBatchSize;

    private int? GetPositiveInt(string environmentKey, string configurationKey)
    {
        var value = _configuration[environmentKey] ?? _configuration[configurationKey];
        return int.TryParse(value, out var parsed) && parsed > 0 ? parsed : null;
    }

    private bool GetBool(string environmentKey, string configurationKey, bool fallback)
    {
        var value = _configuration[environmentKey] ?? _configuration[configurationKey];
        return bool.TryParse(value, out var parsed) ? parsed : fallback;
    }
}
