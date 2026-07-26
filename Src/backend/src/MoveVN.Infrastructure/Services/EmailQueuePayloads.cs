namespace MoveVN.Infrastructure.Services;

internal sealed record OtpEmailPayload(string Otp, string Purpose);

internal sealed record DepositEmailPayload(
    string CustomerName,
    string BookingCode,
    string VehicleName,
    decimal DepositAmount);

internal sealed record NotificationEmailPayload(
    string RecipientName,
    string Title,
    string Body);
