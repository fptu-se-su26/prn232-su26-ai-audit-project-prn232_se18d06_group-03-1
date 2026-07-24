namespace MoveVN.Application.Modules.Payments.DTOs;

public record CreatePaymentLinkResponse(
    string CheckoutUrl,
    string QrCode,
    long OrderCode,
    string PaymentLinkId
);

public record WebhookPaymentData(
    long OrderCode,
    decimal Amount,
    string TransactionReference,
    string PaymentLinkId
);

public record PaymentStatusResponse(
    long OrderCode,
    string Status,
    decimal Amount,
    decimal AmountPaid,
    bool IsConfirmed,
    string Message
);
