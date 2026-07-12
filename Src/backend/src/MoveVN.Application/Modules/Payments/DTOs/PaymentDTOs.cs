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
