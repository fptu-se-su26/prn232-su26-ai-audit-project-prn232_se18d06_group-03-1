using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly string? _smtpHost;
    private readonly int _smtpPort;
    private readonly string? _smtpUser;
    private readonly string? _smtpPass;
    private readonly string? _smtpFrom;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
        _smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST");
        _smtpPort = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var port) ? port : 587;
        _smtpUser = Environment.GetEnvironmentVariable("SMTP_USER");
        _smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS");
        _smtpFrom = Environment.GetEnvironmentVariable("SMTP_FROM") ?? "noreply@movevn.com";
    }

    public async Task SendEmailVerificationAsync(string toEmail, string fullName, string verifyUrl, CancellationToken cancellationToken = default)
    {
        var body = $"""
            <h2>Welcome to MoveVN, {fullName}!</h2>
            <p>Please verify your email by clicking the link below:</p>
            <p><a href="{verifyUrl}">Verify Email</a></p>
            """;
        await SendGenericAsync(toEmail, "Verify your email", body, cancellationToken);
    }

    public async Task SendBookingConfirmationAsync(string toEmail, string fullName, string bookingCode, CancellationToken cancellationToken = default)
    {
        var body = $"""
            <h2>Booking Confirmed</h2>
            <p>Dear {fullName},</p>
            <p>Your booking <strong>{bookingCode}</strong> has been confirmed.</p>
            """;
        await SendGenericAsync(toEmail, "Booking Confirmed - MoveVN", body, cancellationToken);
    }

    public async Task SendPaymentSuccessAsync(string toEmail, string fullName, string bookingCode, decimal amount, CancellationToken cancellationToken = default)
    {
        var body = $"""
            <h2>Payment Successful</h2>
            <p>Dear {fullName},</p>
            <p>Your payment of <strong>{amount:N0} VND</strong> for booking <strong>{bookingCode}</strong> was successful.</p>
            """;
        await SendGenericAsync(toEmail, "Payment Successful - MoveVN", body, cancellationToken);
    }

    public async Task SendVerificationResultAsync(string toEmail, string fullName, bool approved, string? reason, CancellationToken cancellationToken = default)
    {
        var status = approved ? "approved" : "rejected";
        var reasonHtml = !approved && !string.IsNullOrEmpty(reason) ? $"<p>Reason: {reason}</p>" : "";
        var body = $"""
            <h2>Verification {status}</h2>
            <p>Dear {fullName},</p>
            <p>Your identity verification has been <strong>{status}</strong>.</p>
            {reasonHtml}
            """;
        await SendGenericAsync(toEmail, $"Verification {status} - MoveVN", body, cancellationToken);
    }

    public async Task SendCheckInReminderAsync(string toEmail, string fullName, string bookingCode, DateTime checkInTime, CancellationToken cancellationToken = default)
    {
        var body = $"""
            <h2>Check-in Reminder</h2>
            <p>Dear {fullName},</p>
            <p>Your check-in for booking <strong>{bookingCode}</strong> is scheduled at <strong>{checkInTime:HH:mm dd/MM/yyyy}</strong>.</p>
            """;
        await SendGenericAsync(toEmail, "Check-in Reminder - MoveVN", body, cancellationToken);
    }

    public async Task SendGenericAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_smtpHost))
        {
            _logger.LogWarning("SMTP not configured. Skipping email to {Email}: {Subject}", toEmail, subject);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("MoveVN", _smtpFrom));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtpHost, _smtpPort, SecureSocketOptions.StartTls, cancellationToken);

            if (!string.IsNullOrEmpty(_smtpUser))
                await client.AuthenticateAsync(_smtpUser, _smtpPass, cancellationToken);

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}: {Subject}", toEmail, subject);
        }
    }
}
