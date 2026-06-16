namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string toEmail, string fullName, string verifyUrl, CancellationToken cancellationToken = default);
    Task SendBookingConfirmationAsync(string toEmail, string fullName, string bookingCode, CancellationToken cancellationToken = default);
    Task SendPaymentSuccessAsync(string toEmail, string fullName, string bookingCode, decimal amount, CancellationToken cancellationToken = default);
    Task SendVerificationResultAsync(string toEmail, string fullName, bool approved, string? reason, CancellationToken cancellationToken = default);
    Task SendCheckInReminderAsync(string toEmail, string fullName, string bookingCode, DateTime checkInTime, CancellationToken cancellationToken = default);
    Task SendGenericAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
