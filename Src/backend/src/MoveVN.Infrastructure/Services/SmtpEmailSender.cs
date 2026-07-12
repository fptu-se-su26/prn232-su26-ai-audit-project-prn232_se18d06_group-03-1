using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendDepositRequestAsync(string email, string customerName, string bookingCode, string vehicleName, decimal depositAmount, CancellationToken cancellationToken = default)
    {
        var host = _configuration["SMTP_HOST"];
        var fromEmail = _configuration["SMTP_FROM_EMAIL"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromEmail))
        {
            _logger.LogWarning("SMTP is not configured. Skipped sending deposit email to {Email} for booking {BookingCode}", email, bookingCode);
            return;
        }

        var port = int.TryParse(_configuration["SMTP_PORT"], out var parsedPort) ? parsedPort : 587;
        var username = _configuration["SMTP_USERNAME"];
        var password = _configuration["SMTP_PASSWORD"];
        var fromName = _configuration["SMTP_FROM_NAME"] ?? "MoveVN";
        var enableSsl = !bool.TryParse(_configuration["SMTP_ENABLE_SSL"], out var parsedSsl) || parsedSsl;

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = "Yêu cầu đặt cọc cho đơn thuê xe - MoveVN",
            Body = BuildDepositEmailBody(customerName, bookingCode, vehicleName, depositAmount),
            IsBodyHtml = true
        };
        message.To.Add(email);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl
        };

        if (!string.IsNullOrWhiteSpace(username))
        {
            client.Credentials = new NetworkCredential(username, password);
        }

        try
        {
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send deposit email to {Email}", email);
        }
    }

    public async Task SendOtpAsync(string email, string otp, string purpose, CancellationToken cancellationToken = default)
    {
        var host = _configuration["SMTP_HOST"];
        var fromEmail = _configuration["SMTP_FROM_EMAIL"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromEmail))
        {
            _logger.LogWarning("==================================================");
            _logger.LogWarning("SMTP HOST NOT CONFIG. SIMULATED OTP EMAIL SENDING:");
            _logger.LogWarning("Email Target: {Email}", email);
            _logger.LogWarning("OTP Purpose: {Purpose}", purpose);
            _logger.LogWarning("OTP CODE: {Otp}", otp);
            _logger.LogWarning("==================================================");
            return;
        }

        var port = int.TryParse(_configuration["SMTP_PORT"], out var parsedPort) ? parsedPort : 587;
        var username = _configuration["SMTP_USERNAME"];
        var password = _configuration["SMTP_PASSWORD"];
        var fromName = _configuration["SMTP_FROM_NAME"] ?? "MoveVN";
        var enableSsl = !bool.TryParse(_configuration["SMTP_ENABLE_SSL"], out var parsedSsl) || parsedSsl;

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = $"MoveVN OTP - {purpose}",
            Body = BuildOtpEmailBody(otp, purpose),
            IsBodyHtml = true
        };
        message.To.Add(email);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl
        };

        if (!string.IsNullOrWhiteSpace(username))
        {
            client.Credentials = new NetworkCredential(username, password);
        }

        try
        {
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception exception) when (exception is SmtpException or InvalidOperationException)
        {
            _logger.LogError(exception, "SMTP failed to send OTP to {Email}", email);
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    private static string BuildDepositEmailBody(string customerName, string bookingCode, string vehicleName, decimal depositAmount)
    {
        return $$"""
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:600px;margin:0 auto">
            <h2 style="color:#2563eb">MoveVN - Yêu cầu đặt cọc</h2>
            <p>Xin chào <strong>{{WebUtility.HtmlEncode(customerName)}}</strong>,</p>
            <p>Chủ xe đã <strong style="color:#16a34a">duyệt</strong> đơn thuê của bạn.</p>
            <p>Vui lòng chuyển khoản tiền cọc để xác nhận đơn:</p>
            <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
                <p><strong>Mã đơn:</strong> {{WebUtility.HtmlEncode(bookingCode)}}</p>
                <p><strong>Xe:</strong> {{WebUtility.HtmlEncode(vehicleName)}}</p>
                <p><strong>Số tiền cọc:</strong> <span style="font-size:24px;font-weight:700;color:#dc2626">{{depositAmount:N0}} VNĐ</span></p>
            </div>
            <p>Sau khi thanh toán, vui lòng xác nhận trên ứng dụng để hoàn tất.</p>
            <p style="color:#6b7280;font-size:12px">MoveVN - Nền tảng cho thuê xe uy tín</p>
        </div>
        """;
    }

    private static string BuildOtpEmailBody(string otp, string purpose)
    {
        return $$"""
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
            <h2>MoveVN verification code</h2>
            <p>Your OTP for <strong>{{WebUtility.HtmlEncode(purpose)}}</strong> is:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:4px">{{WebUtility.HtmlEncode(otp)}}</p>
            <p>This code is valid for 10 minutes. If it expires, request a new OTP.</p>
        </div>
        """;
    }
}
