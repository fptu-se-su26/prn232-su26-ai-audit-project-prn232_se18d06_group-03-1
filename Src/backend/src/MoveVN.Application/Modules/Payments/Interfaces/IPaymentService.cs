using MoveVN.Application.Modules.Payments.DTOs;

namespace MoveVN.Application.Modules.Payments.Interfaces;

public interface IPaymentService
{
    Task<CreatePaymentLinkResponse> CreatePaymentLinkAsync(long bookingId, long userId, string? returnUrl = null, CancellationToken cancellationToken = default);
    Task<CreatePaymentLinkResponse> CreateTopUpPaymentLinkAsync(long userId, decimal amount, CancellationToken cancellationToken = default);
    Task HandlePaymentConfirmedAsync(MoveVN.Application.Modules.Payments.DTOs.WebhookPaymentData data, CancellationToken cancellationToken = default);

    /// <summary>
    /// Polls PayOS to check payment status. If PAID on PayOS but still Pending locally,
    /// auto-confirms the payment (same logic as webhook). Used as ngrok-free alternative.
    /// </summary>
    Task<PaymentStatusResponse> CheckPaymentStatusAsync(long orderCode, CancellationToken cancellationToken = default);
}
