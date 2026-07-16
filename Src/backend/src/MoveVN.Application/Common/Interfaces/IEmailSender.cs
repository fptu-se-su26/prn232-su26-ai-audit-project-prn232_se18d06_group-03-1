namespace MoveVN.Application.Common.Interfaces;

public interface IEmailSender
{
    Task SendOtpAsync(string email, string otp, string purpose, CancellationToken cancellationToken = default);
    Task SendDepositRequestAsync(string email, string customerName, string bookingCode, string vehicleName, decimal depositAmount, CancellationToken cancellationToken = default);
    Task SendNotificationAsync(string email, string recipientName, string title, string body, CancellationToken cancellationToken = default);
}
