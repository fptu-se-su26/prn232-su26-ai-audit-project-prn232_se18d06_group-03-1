using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.SystemConfigs.DTOs;
using MoveVN.Application.Modules.SystemConfigs.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Api.Services;

public class BookingReminderBackgroundService : BackgroundService
{
    private const int BatchSize = 50;
    private static readonly TimeSpan DefaultScanInterval = TimeSpan.FromMinutes(60);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingReminderBackgroundService> _logger;

    public BookingReminderBackgroundService(IServiceScopeFactory scopeFactory, ILogger<BookingReminderBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RunSafelyAsync(stoppingToken);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(await GetScanIntervalAsync(stoppingToken), stoppingToken);
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
            var config = scope.ServiceProvider.GetRequiredService<ISystemConfigService>();
            if (!await config.GetBoolAsync(SystemConfigKeys.BookingReminderEnabled, true, cancellationToken))
            {
                return;
            }

            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var now = DateTime.UtcNow;

            await SendCheckInRemindersAsync(dbContext, notificationService, config, now, cancellationToken);
            await SendCheckOutRemindersAsync(dbContext, notificationService, config, now, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Booking reminder job failed.");
        }
    }

    private async Task SendCheckInRemindersAsync(
        AppDbContext dbContext,
        INotificationService notificationService,
        ISystemConfigService config,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var reminderHours = await config.GetIntAsync(SystemConfigKeys.CheckInReminderHours, 2, cancellationToken);
        var windowEnd = now.AddHours(Math.Max(1, reminderHours));

        var bookings = await dbContext.Bookings
            .AsNoTracking()
            .Where(booking => (booking.Status == "DepositPaid" || booking.Status == "Confirmed")
                && booking.StartDate >= now
                && booking.StartDate <= windowEnd)
            .OrderBy(booking => booking.StartDate)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        foreach (var booking in bookings)
        {
            var hasReport = await dbContext.InspectionReports.AnyAsync(
                report => report.BookingId == booking.Id && report.Type == "CheckIn",
                cancellationToken);

            if (hasReport)
            {
                continue;
            }

            await NotifyParticipantsAsync(
                dbContext,
                notificationService,
                booking,
                "CheckIn",
                booking.StartDate,
                "Sap den gio check-in",
                $"{booking.BookingCode}: Lich nhan xe se bat dau luc {FormatLocalTime(booking.StartDate)}.",
                cancellationToken);
        }
    }

    private async Task SendCheckOutRemindersAsync(
        AppDbContext dbContext,
        INotificationService notificationService,
        ISystemConfigService config,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var reminderHours = await config.GetIntAsync(SystemConfigKeys.CheckOutReminderHours, 2, cancellationToken);
        var windowEnd = now.AddHours(Math.Max(1, reminderHours));

        var bookings = await dbContext.Bookings
            .AsNoTracking()
            .Where(booking => booking.Status == "InProgress"
                && booking.EndDate >= now
                && booking.EndDate <= windowEnd)
            .OrderBy(booking => booking.EndDate)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        foreach (var booking in bookings)
        {
            var hasReport = await dbContext.InspectionReports.AnyAsync(
                report => report.BookingId == booking.Id && report.Type == "CheckOut",
                cancellationToken);

            if (hasReport)
            {
                continue;
            }

            await NotifyParticipantsAsync(
                dbContext,
                notificationService,
                booking,
                "CheckOut",
                booking.EndDate,
                "Sap den gio check-out",
                $"{booking.BookingCode}: Lich tra xe se bat dau luc {FormatLocalTime(booking.EndDate)}.",
                cancellationToken);
        }
    }

    private async Task NotifyParticipantsAsync(
        AppDbContext dbContext,
        INotificationService notificationService,
        Booking booking,
        string reminderType,
        DateTime scheduledTime,
        string title,
        string body,
        CancellationToken cancellationToken)
    {
        var staffRole = UserRoleType.Staff.ToString();
        var staffIds = await dbContext.UserRoles
            .AsNoTracking()
            .Join(
                dbContext.Roles.AsNoTracking(),
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => new { userRole.UserId, role.Name })
            .Join(
                dbContext.Users.AsNoTracking(),
                row => row.UserId,
                user => user.Id,
                (row, user) => new { row.UserId, row.Name, user.Status })
            .Where(row => row.Name == staffRole && row.Status == "Active")
            .Select(row => row.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var recipients = new[]
            {
                new
                {
                    UserId = booking.CustomerId,
                    RoleTarget = "customer",
                    TargetPath = $"/customer/bookings/{booking.Id}"
                }
            }
            .Concat(staffIds.Select(staffId => new
            {
                UserId = staffId,
                RoleTarget = "staff",
                TargetPath = $"/staff/bookings/{booking.Id}"
            }))
            .Where(x => x.UserId > 0)
            .GroupBy(x => x.UserId)
            .Select(x => x.First())
            .ToList();

        foreach (var recipient in recipients)
        {
            var dedupeKey = $"booking:{booking.Id}:{reminderType}:{scheduledTime:yyyyMMddHHmm}:{recipient.UserId}";
            await notificationService.CreateAsync(new CreateNotificationRequest
            {
                UserId = recipient.UserId,
                Type = "BookingReminder",
                Title = title,
                Body = body,
                DataJson = JsonSerializer.Serialize(new
                {
                    bookingId = booking.Id,
                    bookingCode = booking.BookingCode,
                    reminderType,
                    scheduledTime,
                    roleTarget = recipient.RoleTarget,
                    targetPath = recipient.TargetPath,
                    dedupeKey,
                    action = "BookingReminder"
                }),
                Channel = "InApp",
                DeduplicationKey = dedupeKey
            }, cancellationToken);
        }
    }

    private async Task<TimeSpan> GetScanIntervalAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<ISystemConfigService>();
        var minutes = await config.GetIntAsync(SystemConfigKeys.BookingReminderScanMinutes, (int)DefaultScanInterval.TotalMinutes, cancellationToken);
        return TimeSpan.FromMinutes(Math.Max(1, minutes));
    }

    private static string FormatLocalTime(DateTime value)
        => value.ToLocalTime().ToString("HH:mm dd/MM/yyyy");
}
