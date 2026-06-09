namespace MoveVN.Application.Common.Interfaces;

public interface IEmailSender
{
    Task SendOtpAsync(string email, string otp, string purpose, CancellationToken cancellationToken = default);
}
