using MoveVN.Application.Modules.Payments.DTOs;

namespace MoveVN.Application.Modules.Payments.Interfaces;

public interface IPaymentService
{
    Task<PaymentResponse> CreateDepositAsync(long bookingId, long payerId, string idempotencyKey, CancellationToken cancellationToken = default);

    /// <summary>Mock: đánh dấu payment thành công, sinh contract PDF.</summary>
    Task<PaymentResponse> MockConfirmAsync(long bookingId, string idempotencyKey, CancellationToken cancellationToken = default);

    Task<PaymentResponse?> GetByBookingAsync(long bookingId, CancellationToken cancellationToken = default);
}
