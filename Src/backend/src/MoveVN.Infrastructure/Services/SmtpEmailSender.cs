using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;

    public SmtpEmailSender(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendOtpAsync(string email, string otp, string purpose, CancellationToken cancellationToken = default)
    {
        var host = _configuration["SMTP_HOST"];
        var fromEmail = _configuration["SMTP_FROM_EMAIL"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromEmail))
        {
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
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
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
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
