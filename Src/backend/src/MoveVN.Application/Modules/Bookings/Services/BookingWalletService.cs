using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Helpers;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Disputes.Interfaces;
using MoveVN.Application.Modules.Disputes.Services;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace MoveVN.Application.Modules.Bookings.Services;

public class BookingWalletService : IBookingWalletService
{
    private readonly IWalletRepository _walletRepo;
    private readonly IPaymentRepository _paymentRepo;
    private readonly IDisputeRepository _disputeRepository;
    private readonly IUserRepository _userRepo;
    private readonly IPayOsService _payOsService;
    private readonly IBookingRepository _bookingRepo;
    private readonly ILogger<BookingWalletService> _logger;

    public BookingWalletService(
        IWalletRepository walletRepo,
        IPaymentRepository paymentRepo,
        IDisputeRepository disputeRepository,
        IUserRepository userRepo,
        IPayOsService payOsService,
        IBookingRepository bookingRepo,
        ILogger<BookingWalletService> logger)
    {
        _walletRepo = walletRepo;
        _paymentRepo = paymentRepo;
        _disputeRepository = disputeRepository;
        _userRepo = userRepo;
        _payOsService = payOsService;
        _bookingRepo = bookingRepo;
        _logger = logger;
    }

    public async Task<decimal> GetPaidDepositAmountAsync(long bookingId, CancellationToken ct = default)
    {
        var payments = await _paymentRepo.FindAsync(
            payment => payment.BookingId == bookingId
                && payment.Type == "BookingDeposit"
                && payment.Status == PaymentStatus.Paid,
            ct);

        return payments.Sum(payment => payment.Amount);
    }

    public BookingCancellationQuote BuildCancellationQuote(Booking booking, decimal paidDeposit, DateTime now)
    {
        var cancellableStatuses = new[] { "Pending", "Approved", "DepositPaid", "Confirmed" };
        var canCancel = cancellableStatuses.Contains(booking.Status) && now < booking.StartDate;
        var calculation = BookingCancellationPolicy.Calculate(paidDeposit, booking.StartDate, now);
        var message = canCancel
            ? paidDeposit > 0 ? calculation.PolicyMessage : "Booking chưa thanh toán cọc nên được hủy miễn phí."
            : now >= booking.StartDate
                ? "Đã đến giờ nhận xe, booking không thể hủy theo chính sách thông thường."
                : "Booking ở trạng thái hiện tại không thể hủy.";

        return new BookingCancellationQuote
        {
            BookingId = booking.Id,
            CanCancel = canCancel,
            HasPaidDeposit = paidDeposit > 0,
            PaidDepositAmount = paidDeposit,
            RefundPercent = paidDeposit > 0 ? calculation.RefundPercent : 100,
            RefundAmount = calculation.RefundAmount,
            ForfeitedAmount = calculation.ForfeitedAmount,
            HoursBeforePickup = Math.Max((booking.StartDate - now).TotalHours, 0),
            PolicyMessage = message,
        };
    }

    public async Task ReleaseCompletedEscrowAsync(
        Booking booking,
        decimal completedDisputePayouts,
        decimal completedDepositRefunds,
        DateTime settledAt,
        CancellationToken ct = default)
    {
        if (booking.EscrowStatus == "Released"
            || await _walletRepo.TransactionExistsAsync($"booking_escrow_owner_release_{booking.Id}", ct))
            return;

        var escrowAmount = booking.EscrowAmount > 0m ? booking.EscrowAmount : booking.DepositAmount;
        var settlement = EscrowSettlementCalculator.ForCompletion(escrowAmount, booking.PlatformFee);
        await CreditPlatformFeeToAdminAsync(booking, settledAt, ct, settlement.PlatformFee);

        var ownerAmount = Math.Max(settlement.OwnerAmount - completedDisputePayouts - completedDepositRefunds, 0m);
        if (ownerAmount > 0m)
        {
            var ownerWallet = (await _walletRepo.FindAsync(wallet => wallet.UserId == booking.OwnerId, ct)).FirstOrDefault();
            if (ownerWallet is null)
            {
                ownerWallet = new Wallet { UserId = booking.OwnerId };
                await _walletRepo.AddAsync(ownerWallet, ct);
                await _bookingRepo.SaveChangesAsync(ct);
            }

            ownerWallet.Balance += ownerAmount;
            ownerWallet.TotalEarned += ownerAmount;
            ownerWallet.UpdatedAt = settledAt;
            _walletRepo.Update(ownerWallet);
            await _walletRepo.AddTransactionAsync(new WalletTransaction
            {
                WalletId = ownerWallet.Id,
                Type = WalletTransactionType.BookingEarning,
                Amount = ownerAmount,
                BalanceAfter = ownerWallet.Balance,
                ReferenceId = booking.Id,
                IdempotencyKey = $"booking_escrow_owner_release_{booking.Id}",
                Note = $"Thu nhập từ booking {booking.BookingCode}: +{ownerAmount:N0}đ (Phí nền tảng: {settlement.PlatformFee:N0}đ)",
                Status = "Completed",
                CreatedAt = settledAt,
            }, ct);

            await AutoPayoutToOwnerAsync(booking, ownerAmount, ct);
        }

        booking.EscrowAmount = escrowAmount;
        booking.EscrowStatus = "Released";
        booking.EscrowSettledAt = settledAt;
        _bookingRepo.Update(booking);
    }

    public async Task ApplyCancellationWalletSettlementAsync(
        Booking booking,
        BookingCancellationQuote quote,
        DateTime cancelledAt,
        CancellationToken ct = default)
    {
        if (!quote.HasPaidDeposit || quote.PaidDepositAmount <= 0m)
            return;

        var settlement = EscrowSettlementCalculator.ForCancellation(quote.PaidDepositAmount, quote.RefundPercent);
        booking.CancellationRefundAmount = settlement.RefundAmount;
        booking.CancellationForfeitedAmount = settlement.ForfeitedAmount;
        booking.CancellationOwnerCompensation = settlement.OwnerAmount;
        booking.CancellationPlatformFee = settlement.PlatformFee;
        booking.CancellationPolicyTier = quote.RefundPercent switch
        {
            100 => "AtLeast7Days",
            50 => "From3To7Days",
            _ => "LessThan3Days"
        };
        booking.CancellationSource = "Customer";
        booking.EscrowStatus = settlement.RefundAmount == quote.PaidDepositAmount
            ? "Refunded"
            : settlement.RefundAmount > 0m ? "PartiallyForfeited" : "Forfeited";
        booking.EscrowSettledAt = cancelledAt;

        // Reverse deposit-time owner earning
        var depositOwnerEarning = Math.Max(quote.PaidDepositAmount - Math.Min(booking.PlatformFee, quote.PaidDepositAmount), 0m);
        var ownerEarningReversalKey = $"booking_cancel_deposit_earning_reversal_{booking.Id}";
        if (depositOwnerEarning > 0m
            && !await _walletRepo.TransactionExistsAsync(ownerEarningReversalKey, ct)
            && await _walletRepo.TransactionExistsAsync($"booking_escrow_owner_release_{booking.Id}", ct))
        {
            var ownerWallet = (await _walletRepo.FindAsync(w => w.UserId == booking.OwnerId, ct)).FirstOrDefault();
            if (ownerWallet is not null)
            {
                ownerWallet.Balance -= depositOwnerEarning;
                ownerWallet.TotalEarned = Math.Max(ownerWallet.TotalEarned - depositOwnerEarning, 0m);
                ownerWallet.UpdatedAt = cancelledAt;
                _walletRepo.Update(ownerWallet);
                await _walletRepo.AddTransactionAsync(new WalletTransaction
                {
                    WalletId = ownerWallet.Id,
                    Type = WalletTransactionType.BookingEarningReversal,
                    Amount = -depositOwnerEarning,
                    BalanceAfter = ownerWallet.Balance,
                    ReferenceId = booking.Id,
                    IdempotencyKey = ownerEarningReversalKey,
                    Note = $"Thu hồi khoản cọc đã cộng khi thanh toán booking {booking.BookingCode}",
                    Status = "Completed",
                    CreatedAt = cancelledAt,
                }, ct);
            }
        }

        // Reverse deposit-time platform fee
        var depositPlatformFee = Math.Min(Math.Max(booking.PlatformFee, 0m), quote.PaidDepositAmount);
        var adminFeeReversalKey = $"booking_cancel_deposit_platform_fee_reversal_{booking.Id}";
        if (depositPlatformFee > 0m
            && !await _walletRepo.TransactionExistsAsync(adminFeeReversalKey, ct)
            && await _walletRepo.TransactionExistsAsync($"booking_platform_fee_{booking.Id}", ct))
        {
            var adminId = (await _disputeRepository.GetAdminUserIdsAsync(ct)).OrderBy(id => id).FirstOrDefault();
            if (adminId > 0)
            {
                var adminWallet = (await _walletRepo.FindAsync(w => w.UserId == adminId, ct)).FirstOrDefault();
                if (adminWallet is not null)
                {
                    adminWallet.Balance -= depositPlatformFee;
                    adminWallet.TotalEarned = Math.Max(adminWallet.TotalEarned - depositPlatformFee, 0m);
                    adminWallet.UpdatedAt = cancelledAt;
                    _walletRepo.Update(adminWallet);
                    await _walletRepo.AddTransactionAsync(new WalletTransaction
                    {
                        WalletId = adminWallet.Id,
                        Type = WalletTransactionType.PlatformFeeRevenue,
                        Amount = -depositPlatformFee,
                        BalanceAfter = adminWallet.Balance,
                        ReferenceId = booking.Id,
                        IdempotencyKey = adminFeeReversalKey,
                        Note = $"Thu hồi phí nền tảng đã cộng khi thanh toán booking {booking.BookingCode}",
                        Status = "Completed",
                        CreatedAt = cancelledAt,
                    }, ct);
                }
            }
        }

        if (settlement.OwnerAmount > 0m
            && !await _walletRepo.TransactionExistsAsync($"booking_cancel_compensation_{booking.Id}", ct))
        {
            var ownerWallet = (await _walletRepo.FindAsync(w => w.UserId == booking.OwnerId, ct)).FirstOrDefault();
            if (ownerWallet is null)
            {
                ownerWallet = new Wallet { UserId = booking.OwnerId };
                await _walletRepo.AddAsync(ownerWallet, ct);
                await _bookingRepo.SaveChangesAsync(ct);
            }

            ownerWallet.Balance += settlement.OwnerAmount;
            ownerWallet.TotalEarned += settlement.OwnerAmount;
            ownerWallet.UpdatedAt = cancelledAt;
            _walletRepo.Update(ownerWallet);
            await _walletRepo.AddTransactionAsync(new WalletTransaction
            {
                WalletId = ownerWallet.Id,
                Type = WalletTransactionType.BookingEarning,
                Amount = settlement.OwnerAmount,
                BalanceAfter = ownerWallet.Balance,
                ReferenceId = booking.Id,
                IdempotencyKey = $"booking_cancel_compensation_{booking.Id}",
                Note = $"Bồi hoàn do khách hủy booking {booking.BookingCode}",
                Status = "Completed",
                CreatedAt = cancelledAt,
            }, ct);
        }

        if (settlement.RefundAmount > 0m
            && !await _walletRepo.TransactionExistsAsync($"booking_cancellation_refund_{booking.Id}", ct))
        {
            var customerWallet = (await _walletRepo.FindAsync(w => w.UserId == booking.CustomerId, ct)).FirstOrDefault();
            if (customerWallet is null)
            {
                customerWallet = new Wallet { UserId = booking.CustomerId };
                await _walletRepo.AddAsync(customerWallet, ct);
                await _bookingRepo.SaveChangesAsync(ct);
            }

            customerWallet.Balance += settlement.RefundAmount;
            customerWallet.TotalSpent = Math.Max(customerWallet.TotalSpent - settlement.RefundAmount, 0m);
            customerWallet.UpdatedAt = cancelledAt;
            _walletRepo.Update(customerWallet);
            await _walletRepo.AddTransactionAsync(new WalletTransaction
            {
                WalletId = customerWallet.Id,
                Type = WalletTransactionType.Refund,
                Amount = settlement.RefundAmount,
                BalanceAfter = customerWallet.Balance,
                ReferenceId = booking.Id,
                IdempotencyKey = $"booking_cancellation_refund_{booking.Id}",
                Note = $"Hoàn {quote.RefundPercent}% tiền cọc booking {booking.BookingCode}",
                Status = "Completed",
                CreatedAt = cancelledAt,
            }, ct);
        }

        if (settlement.PlatformFee > 0m
            && !await _walletRepo.TransactionExistsAsync($"booking_cancel_platform_fee_{booking.Id}", ct))
        {
            var adminId = (await _disputeRepository.GetAdminUserIdsAsync(ct)).OrderBy(id => id).FirstOrDefault();
            if (adminId > 0)
            {
                var adminWallet = (await _walletRepo.FindAsync(w => w.UserId == adminId, ct)).FirstOrDefault();
                if (adminWallet is null)
                {
                    adminWallet = new Wallet { UserId = adminId };
                    await _walletRepo.AddAsync(adminWallet, ct);
                    await _bookingRepo.SaveChangesAsync(ct);
                }

                adminWallet.Balance += settlement.PlatformFee;
                adminWallet.TotalEarned += settlement.PlatformFee;
                adminWallet.UpdatedAt = cancelledAt;
                _walletRepo.Update(adminWallet);
                await _walletRepo.AddTransactionAsync(new WalletTransaction
                {
                    WalletId = adminWallet.Id,
                    Type = WalletTransactionType.PlatformFeeRevenue,
                    Amount = settlement.PlatformFee,
                    BalanceAfter = adminWallet.Balance,
                    ReferenceId = booking.Id,
                    IdempotencyKey = $"booking_cancel_platform_fee_{booking.Id}",
                    Note = $"Phí nền tảng giữ lại khi khách hủy booking {booking.BookingCode}",
                    Status = "Completed",
                    CreatedAt = cancelledAt,
                }, ct);
            }
        }

        var paidPayments = await _paymentRepo.FindAsync(
            p => p.BookingId == booking.Id
                && p.Type == "BookingDeposit"
                && p.Status == PaymentStatus.Paid,
            ct);
        foreach (var payment in paidPayments)
        {
            payment.RefundedAmount = Math.Min(settlement.RefundAmount, payment.Amount);
            payment.RefundedAt = payment.RefundedAmount > 0m ? cancelledAt : null;
            if (payment.RefundedAmount == payment.Amount)
                payment.Status = PaymentStatus.Refunded;
            else if (payment.RefundedAmount > 0m)
                payment.Status = PaymentStatus.PartiallyRefunded;
            payment.Note = $"Khách hủy booking: hoàn {quote.RefundPercent}% tiền cọc.";
            _paymentRepo.Update(payment);
        }
    }

    public async Task<decimal> CreditPlatformFeeToAdminAsync(
        Booking booking,
        DateTime completedAt,
        CancellationToken ct,
        decimal? amountOverride = null,
        string? note = null)
    {
        var feeAmount = amountOverride
            ?? Math.Min(Math.Max(booking.PlatformFee, 0m), Math.Max(booking.DepositAmount, 0m));
        var idempotencyKey = $"booking_platform_fee_{booking.Id}";
        if (feeAmount <= 0m || await _walletRepo.TransactionExistsAsync(idempotencyKey, ct))
        {
            return 0m;
        }

        var adminId = (await _disputeRepository.GetAdminUserIdsAsync(ct)).OrderBy(id => id).FirstOrDefault();
        if (adminId <= 0)
        {
            throw new ValidationException(["Khong the quyet toan phi nen tang vi chua co tai khoan Admin."]);
        }

        var adminWallet = (await _walletRepo.FindAsync(w => w.UserId == adminId, ct)).FirstOrDefault();
        if (adminWallet is null)
        {
            adminWallet = new Wallet { UserId = adminId };
            await _walletRepo.AddAsync(adminWallet, ct);
            await _bookingRepo.SaveChangesAsync(ct);
        }

        adminWallet.Balance += feeAmount;
        adminWallet.TotalEarned += feeAmount;
        adminWallet.UpdatedAt = completedAt;
        _walletRepo.Update(adminWallet);
        await _walletRepo.AddTransactionAsync(new WalletTransaction
        {
            WalletId = adminWallet.Id,
            Type = WalletTransactionType.PlatformFeeRevenue,
            Amount = feeAmount,
            BalanceAfter = adminWallet.Balance,
            ReferenceId = booking.Id,
            IdempotencyKey = idempotencyKey,
            Note = note ?? $"Phí nền tảng từ booking {booking.BookingCode}: {feeAmount:N0}đ (Chủ xe nhận: {Math.Max((booking.EscrowAmount > 0m ? booking.EscrowAmount : booking.DepositAmount) - feeAmount, 0m):N0}đ)",
            Status = "Completed"
        }, ct);

        return feeAmount;
    }

    public async Task AutoPayoutToOwnerAsync(Booking booking, decimal ownerAmount, CancellationToken ct = default)
    {
        var idempotencyKey = $"auto_payout_booking_{booking.Id}";
        if (await _walletRepo.TransactionExistsAsync(idempotencyKey, ct))
            return;

        var ownerProfile = await _userRepo.GetOwnerProfileByUserIdAsync(booking.OwnerId, ct);
        if (ownerProfile is null || string.IsNullOrEmpty(ownerProfile.BankAccountNumber) || string.IsNullOrEmpty(ownerProfile.BankName))
        {
            _logger.LogInformation("Auto-payout skipped for booking #{Id}: owner has no bank details", booking.Id);
            return;
        }

        try
        {
            var payoutInput = new CreatePayoutInput
            {
                ReferenceId = $"bk_{booking.Id}_{DateTime.UtcNow.Ticks}",
                Amount = (int)ownerAmount,
                Description = $"PAYOUT BK#{booking.Id}",
                ToBin = BankBinResolver.Resolve(ownerProfile.BankBin, ownerProfile.BankName),
                ToAccountNumber = ownerProfile.BankAccountNumber
            };

            var payoutResult = await _payOsService.CreatePayoutAsync(payoutInput);

            _logger.LogInformation("Auto-payout #{PayoutId} created for booking #{BookingId}, amount={Amount}",
                payoutResult.PayoutId, booking.Id, ownerAmount);

            var ownerWallet = (await _walletRepo.FindAsync(w => w.UserId == booking.OwnerId, ct)).FirstOrDefault();
            if (ownerWallet is not null)
            {
                ownerWallet.Balance -= ownerAmount;
                ownerWallet.TotalSpent += ownerAmount;
                ownerWallet.UpdatedAt = DateTime.UtcNow;
                _walletRepo.Update(ownerWallet);

                await _walletRepo.AddTransactionAsync(new WalletTransaction
                {
                    WalletId = ownerWallet.Id,
                    Type = "Withdrawal",
                    Amount = -ownerAmount,
                    BalanceAfter = ownerWallet.Balance,
                    ReferenceId = booking.Id,
                    IdempotencyKey = idempotencyKey,
                    Note = $"Tự động chuyển tiền booking {booking.BookingCode} về tài khoản ngân hàng",
                    Status = "Completed",
                    CreatedAt = DateTime.UtcNow,
                }, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Auto-payout failed for booking #{BookingId}", booking.Id);
        }
    }

    public async Task<decimal> RefundDepositToCustomerAsync(
        Booking booking,
        decimal completedDisputePayouts,
        decimal completedDepositRefunds,
        DateTime completedAt,
        CancellationToken ct = default)
    {
        var idempotencyKey = $"booking_deposit_refund_{booking.Id}";
        if (await _walletRepo.TransactionExistsAsync(idempotencyKey, ct))
        {
            return 0m;
        }

        var refundAmount = DisputeDepositCalculator.GetAvailableAmount(
            booking.DepositAmount,
            booking.PlatformFee,
            completedDisputePayouts,
            completedDepositRefunds);
        if (refundAmount <= 0m)
        {
            return 0m;
        }

        var customerWallet = (await _walletRepo.FindAsync(w => w.UserId == booking.CustomerId, ct)).FirstOrDefault();
        if (customerWallet is null)
        {
            customerWallet = new Wallet { UserId = booking.CustomerId };
            await _walletRepo.AddAsync(customerWallet, ct);
            await _bookingRepo.SaveChangesAsync(ct);
        }

        customerWallet.Balance += refundAmount;
        customerWallet.TotalSpent = Math.Max(customerWallet.TotalSpent - refundAmount, 0m);
        customerWallet.UpdatedAt = completedAt;
        _walletRepo.Update(customerWallet);
        await _walletRepo.AddTransactionAsync(new WalletTransaction
        {
            WalletId = customerWallet.Id,
            Type = WalletTransactionType.Refund,
            Amount = refundAmount,
            BalanceAfter = customerWallet.Balance,
            ReferenceId = booking.Id,
            IdempotencyKey = idempotencyKey,
            Note = $"Hoàn tiền đặt cọc booking {booking.BookingCode}",
            Status = "Completed"
        }, ct);

        return refundAmount;
    }
}
