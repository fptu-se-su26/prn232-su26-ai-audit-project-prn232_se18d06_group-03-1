using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Infrastructure.Services;

public class QueuedEmailSender : IEmailSender
{
    private readonly IServiceScopeFactory _scopeFactory;

    public QueuedEmailSender(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public Task SendOtpAsync(
        string email,
        string otp,
        string purpose,
        CancellationToken cancellationToken = default)
        => EnqueueAsync(
            "Otp",
            email,
            null,
            $"MoveVN OTP - {purpose}",
            new OtpEmailPayload(otp, purpose),
            cancellationToken);

    public Task SendDepositRequestAsync(
        string email,
        string customerName,
        string bookingCode,
        string vehicleName,
        decimal depositAmount,
        CancellationToken cancellationToken = default)
        => EnqueueAsync(
            "DepositRequest",
            email,
            customerName,
            "Yêu cầu đặt cọc cho đơn thuê xe - MoveVN",
            new DepositEmailPayload(customerName, bookingCode, vehicleName, depositAmount),
            cancellationToken);

    public Task SendNotificationAsync(
        string email,
        string recipientName,
        string title,
        string body,
        CancellationToken cancellationToken = default)
        => EnqueueAsync(
            "Notification",
            email,
            recipientName,
            $"MoveVN - {NormalizeSubject(title)}",
            new NotificationEmailPayload(recipientName, title, body),
            cancellationToken);

    private async Task EnqueueAsync<TPayload>(
        string emailType,
        string email,
        string? recipientName,
        string subject,
        TPayload payload,
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        dbContext.EmailLogs.Add(new EmailLog
        {
            EmailType = emailType,
            RecipientEmail = email.Trim(),
            RecipientName = recipientName?.Trim(),
            Subject = subject,
            PayloadJson = JsonSerializer.Serialize(payload),
            Status = "Pending",
            AttemptCount = 0,
            MaxAttempts = 3,
            NextAttemptAt = now,
            CreatedAt = now,
            UpdatedAt = now
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string NormalizeSubject(string title)
    {
        var subject = title.Replace("\r", " ").Replace("\n", " ").Trim();
        return subject.Length <= 120 ? subject : subject[..117] + "...";
    }
}
