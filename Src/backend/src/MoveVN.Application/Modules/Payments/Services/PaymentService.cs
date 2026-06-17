using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Contracts.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Payments.DTOs;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Application.Modules.Reports.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Payments.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _repo;
    private readonly INotificationService _notifications;
    private readonly IContractService _contracts;
    private readonly IDisputeService _disputes;

    public PaymentService(
        IPaymentRepository repo,
        INotificationService notifications,
        IContractService contracts,
        IDisputeService disputes)
    {
        _repo = repo;
        _notifications = notifications;
        _contracts = contracts;
        _disputes = disputes;
    }

    public async Task<PaymentResponse> CreateDepositAsync(long bookingId, long payerId, string idempotencyKey, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetBookingAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.Status != "Approved")
            throw new ValidationException(new[] { "Booking must be approved before deposit payment." });

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
            ?? throw new NotFoundException("Payment not found.");

        if (payment.Status == "Paid")
            return MapToDto(payment);

        payment.Status = "Paid";
        payment.PaidAt = DateTime.UtcNow;
        _repo.Update(payment);

        var booking = await _repo.GetBookingAsync(bookingId, cancellationToken);
        if (booking is not null)
        {
            booking.Status = "DepositPaid";
            booking.UpdatedAt = DateTime.UtcNow;
            _repo.UpdateBooking(booking);
        }

        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _contracts.GenerateAsync(bookingId, cancellationToken));

        if (booking is not null)
        {
            _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
            {
                UserId = booking.CustomerId,
                Type = "PaymentSuccess",
                Title = "Deposit paid successfully",
                Body = $"Booking #{booking.BookingCode} deposit was paid successfully."
            }));
        }

        return MapToDto(payment);
    }

    public async Task<PaymentResponse> RefundDepositAsync(long bookingId, long staffId, RefundPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetBookingAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");

        var deposit = (await _repo.FindAllByBookingAsync(bookingId, cancellationToken))
            .FirstOrDefault(p => p.Type == "Deposit" && p.Status == "Paid")
            ?? throw new NotFoundException("Paid deposit not found.");

        var refundAmount = request.Action switch
        {
            "FullRefund" => deposit.Amount,
            "PartialRefund" => Math.Max(0, deposit.Amount - (request.DeductionAmount ?? 0)),
            "OpenDispute" => 0,
            _ => throw new ValidationException(new[] { "Invalid refund action." })
        };

        var refund = new Payment
        {
            BookingId = bookingId,
            PayerId = deposit.PayerId,
            Type = "Refund",
            Amount = refundAmount,
            Currency = deposit.Currency,
            Gateway = deposit.Gateway,
            Status = request.Action == "OpenDispute" ? "Pending" : "Paid",
            IdempotencyKey = Guid.NewGuid().ToString(),
            PaidAt = request.Action == "OpenDispute" ? null : DateTime.UtcNow,
            Note = request.Note
        };

        await _repo.AddAsync(refund, cancellationToken);

        if (request.Action == "OpenDispute")
        {
            await _disputes.OpenAsync(new CreateDisputeRequest
            {
                BookingId = bookingId,
                Description = request.Note ?? "Dispute opened during checkout review.",
                EvidenceUrls = request.EvidenceUrls
            }, staffId, cancellationToken);
            booking.Status = "Disputed";
        }
        else
        {
            booking.Status = "Completed";
        }

        booking.UpdatedAt = DateTime.UtcNow;
        _repo.UpdateBooking(booking);
        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = booking.CustomerId,
            Type = "RefundProcessed",
            Title = request.Action == "OpenDispute" ? "Deposit under dispute review" : "Deposit refunded",
            Body = request.Action == "OpenDispute"
                ? $"Booking #{booking.BookingCode} has entered dispute review."
                : $"Refund {refundAmount:N0} VND has been processed for booking #{booking.BookingCode}."
        }));

        return MapToDto(refund);
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
