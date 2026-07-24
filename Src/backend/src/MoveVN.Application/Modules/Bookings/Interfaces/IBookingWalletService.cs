using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Bookings.Interfaces;

public interface IBookingWalletService
{
    Task<decimal> GetPaidDepositAmountAsync(long bookingId, CancellationToken ct = default);

    BookingCancellationQuote BuildCancellationQuote(Booking booking, decimal paidDeposit, DateTime now);

    Task ReleaseCompletedEscrowAsync(
        Booking booking,
        decimal completedDisputePayouts,
        decimal completedDepositRefunds,
        DateTime settledAt,
        CancellationToken ct = default);

    Task ApplyCancellationWalletSettlementAsync(
        Booking booking,
        BookingCancellationQuote quote,
        DateTime cancelledAt,
        CancellationToken ct = default);

    Task<decimal> CreditPlatformFeeToAdminAsync(
        Booking booking,
        DateTime completedAt,
        CancellationToken ct,
        decimal? amountOverride = null,
        string? note = null);

    Task AutoPayoutToOwnerAsync(Booking booking, decimal ownerAmount, CancellationToken ct = default);

    Task<decimal> RefundDepositToCustomerAsync(
        Booking booking,
        decimal completedDisputePayouts,
        decimal completedDepositRefunds,
        DateTime completedAt,
        CancellationToken ct = default);
}
