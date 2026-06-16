using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Contracts.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Payments.DTOs;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Payments.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _repo;
    private readonly INotificationService _notifications;
    private readonly IContractService _contracts;

    public PaymentService(IPaymentRepository repo, INotificationService notifications, IContractService contracts)
    {
        _repo = repo;
        _notifications = notifications;
        _contracts = contracts;
    }

    public async Task<PaymentResponse> CreateDepositAsync(long bookingId, long payerId, string idempotencyKey, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetBookingAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.Status != "Approved")
            throw new ValidationException(new[] { "Booking chưa được Owner duyệt." });

        // Idempotency check
        var existing = await _repo.FindByIdempotencyKeyAsync(idempotencyKey, cancellationToken);
        if (existing is not null)
            return MapToDto(existing);

        var payment = new Payment
        {
            BookingId = bookingId,
            PayerId = payerId,
            Type = "Deposit",
            Amount = booking.DepositAmount,
            Currency = "VND",
            Gateway = "Mock",
            Status = "Pending",
            IdempotencyKey = idempotencyKey
        };

        await _repo.AddAsync(payment, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);
        return MapToDto(payment);
    }

    public async Task<PaymentResponse> MockConfirmAsync(long bookingId, string idempotencyKey, CancellationToken cancellationToken = default)
    {
        var payment = await _repo.FindByBookingAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Payment không tồn tại.");

        if (payment.Status == "Paid")
            return MapToDto(payment);

        payment.Status = "Paid";
        payment.PaidAt = DateTime.UtcNow;
        _repo.Update(payment);

        // Update booking status -> DepositPaid
        var booking = await _repo.GetBookingAsync(bookingId, cancellationToken);
        if (booking is not null)
        {
            booking.Status = "DepositPaid";
            booking.UpdatedAt = DateTime.UtcNow;
            _repo.UpdateBooking(booking);
        }

        await _repo.SaveChangesAsync(cancellationToken);

        // Generate contract PDF
        _ = Task.Run(() => _contracts.GenerateAsync(bookingId, cancellationToken));

        // Notify
        if (booking is not null)
        {
            _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
            {
                UserId = booking.CustomerId,
                Type = "PaymentSuccess",
                Title = "Thanh toán thành công",
                Body = $"Đặt cọc booking #{booking.BookingCode} thành công. Hợp đồng đã được tạo."
            }));
        }

        return MapToDto(payment);
    }

    public async Task<PaymentResponse?> GetByBookingAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        var payment = await _repo.FindByBookingAsync(bookingId, cancellationToken);
        return payment is null ? null : MapToDto(payment);
    }

    private static PaymentResponse MapToDto(Payment p) => new()
    {
        Id = p.Id,
        BookingId = p.BookingId,
        Type = p.Type,
        Amount = p.Amount,
        Currency = p.Currency,
        Gateway = p.Gateway,
        GatewayTransactionId = p.GatewayTransactionId,
        Status = p.Status,
        PaidAt = p.PaidAt,
        Note = p.Note,
        CreatedAt = p.CreatedAt
    };
}
