using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Payments.DTOs;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using System.Text.Json;

namespace MoveVN.Application.Modules.Payments.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IBookingRepository _bookingRepo;
    private readonly IPayOsService _payOsService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PaymentService> _logger;
    private readonly IRedisLockService _lockService;
    private readonly INotificationService _notificationService;

    public PaymentService(
        IPaymentRepository paymentRepo,
        IWalletRepository walletRepo,
        IBookingRepository bookingRepo,
        IPayOsService payOsService,
        IUnitOfWork unitOfWork,
        ILogger<PaymentService> logger,
        IRedisLockService lockService,
        INotificationService notificationService)
    {
        _paymentRepo = paymentRepo;
        _walletRepo = walletRepo;
        _bookingRepo = bookingRepo;
        _payOsService = payOsService;
        _unitOfWork = unitOfWork;
        _logger = logger;
        _lockService = lockService;
        _notificationService = notificationService;
    }

    public async Task<CreatePaymentLinkResponse> CreatePaymentLinkAsync(long bookingId, long customerId, string? returnUrl = null, CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(new[] { "Bạn không có quyền thanh toán booking này." });

        if (booking.Status != "Approved")
            throw new ValidationException(new[] { "Booking chưa được duyệt, không thể thanh toán cọc." });
            
        // Check if there is already a Pending payment
        var existingPayments = await _paymentRepo.FindAsync(p => p.BookingId == bookingId && p.Status == PaymentStatus.Pending, cancellationToken);
        var existingPayment = existingPayments.FirstOrDefault();
        
        long orderCode;
        if (existingPayment != null && existingPayment.OrderCode.HasValue)
        {
            orderCode = existingPayment.OrderCode.Value;
            // Optionally, check with PayOS if it is still valid
            try 
            {
                var payOsInfo = await _payOsService.GetPaymentLinkInfoAsync(orderCode);
                if (payOsInfo.Status == "PENDING")
                {
                    // It's still valid, we just create a new link with the same order code (not possible, so we just return the existing if we had it, but we don't store checkoutUrl).
                    // Best practice: Cancel the old one and create a new one, or just generate a new order code.
                    await _payOsService.CancelPaymentLinkAsync(orderCode, "User requested new link");
                    existingPayment.Status = PaymentStatus.Cancelled;
                    _paymentRepo.Update(existingPayment);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }
            } 
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get or cancel existing payment link");
            }
        }

        // Generate unique OrderCode (PayOS requires Int64)
        orderCode = long.Parse($"{bookingId}{DateTime.UtcNow:yyMMddHHmmss}");

        var amount = booking.DepositAmount; // Usually customer pays deposit first

        if (amount <= 0)
        {
            amount = booking.TotalAmount; // If no deposit, pay full amount? Assuming deposit for now.
        }

        var payment = new Payment
        {
            BookingId = booking.Id,
            PayerId = customerId,
            Type = "BookingDeposit",
            Amount = amount,
            Gateway = "PayOS",
            Status = PaymentStatus.Pending,
            OrderCode = orderCode,
            IdempotencyKey = Guid.NewGuid().ToString()
        };

        await _paymentRepo.AddAsync(payment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Ensure return and cancel URLs point to the booking page instead of the wallet page
        if (string.IsNullOrWhiteSpace(returnUrl) || returnUrl.Contains("/account/wallet"))
        {
            if (!string.IsNullOrWhiteSpace(returnUrl))
            {
                returnUrl = returnUrl.Replace("/account/wallet", $"/booking/{bookingId}");
            }
            else
            {
                returnUrl = $"http://localhost:5173/booking/{bookingId}";
            }
        }

        var result = await _payOsService.CreatePaymentLinkAsync(new CreatePaymentLinkInput
        {
            OrderCode = orderCode,
            Amount = (int)amount,
            Description = $"Coc don xe {booking.BookingCode}",
            Items = new List<PaymentItemInput>
            {
                new PaymentItemInput("Tiền cọc thuê xe", 1, (int)amount)
            },
            ExpireAfterMinutes = 30,
            ReturnUrl = returnUrl,
            CancelUrl = returnUrl
        });

        payment.GatewayTransactionId = result.PaymentLinkId;
        _paymentRepo.Update(payment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreatePaymentLinkResponse(
            CheckoutUrl: result.CheckoutUrl,
            QrCode: result.QrCode,
            OrderCode: result.OrderCode,
            PaymentLinkId: result.PaymentLinkId
        );
    }

    public async Task HandlePaymentConfirmedAsync(WebhookPaymentData data, CancellationToken cancellationToken = default)
    {
        var lockHandle = await _lockService.AcquireLockAsync($"payment_webhook:{data.OrderCode}", TimeSpan.FromSeconds(30), cancellationToken);
        if (lockHandle == null)
        {
            _logger.LogWarning("Webhook for OrderCode {OrderCode} is already being processed.", data.OrderCode);
            return;
        }

        try
        {
            var payments = await _paymentRepo.FindAsync(p => p.OrderCode == data.OrderCode, cancellationToken);
            var payment = payments.FirstOrDefault();

            if (payment == null)
            {
                _logger.LogError("Payment with OrderCode {OrderCode} not found.", data.OrderCode);
                return;
            }

            if (payment.Status == PaymentStatus.Paid)
            {
                _logger.LogInformation("Payment {OrderCode} was already marked as Paid.", data.OrderCode);
                return;
            }

            if (payment.Amount != data.Amount)
            {
                _logger.LogWarning("Amount mismatch for Payment {PaymentId}. Expected {Expected}, Got {Actual}", payment.Id, payment.Amount, data.Amount);
            }

            // 1. Update Payment
            payment.Status = PaymentStatus.Paid;
            payment.PaidAt = DateTime.UtcNow;
            payment.GatewayTransactionId = data.PaymentLinkId; 
            _paymentRepo.Update(payment);

            // 2. Customer Wallet Operations
            var customerWallets = await _walletRepo.FindAsync(w => w.UserId == payment.PayerId, cancellationToken);
            var customerWallet = customerWallets.FirstOrDefault();
            if (customerWallet == null)
            {
                customerWallet = new Wallet { UserId = payment.PayerId, Balance = 0, TotalEarned = 0, TotalSpent = 0 };
                await _walletRepo.AddAsync(customerWallet, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken); 
            }

            var topUpTx = new WalletTransaction
            {
                WalletId = customerWallet.Id,
                Type = WalletTransactionType.TopUp,
                Amount = data.Amount,
                BalanceAfter = customerWallet.Balance + data.Amount,
                ReferenceId = payment.Id,
                IdempotencyKey = $"topup_{payment.Id}",
                Note = "Nạp tiền qua PayOS"
            };
            await _walletRepo.AddTransactionAsync(topUpTx, cancellationToken);
            customerWallet.Balance += data.Amount;
            customerWallet.TotalEarned += data.Amount;

            if (payment.Type == "TopUp")
            {
                _walletRepo.Update(customerWallet);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                
                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    UserId = payment.PayerId,
                    Type = "System",
                    Title = "Nạp tiền thành công",
                    Body = $"Bạn đã nạp thành công {data.Amount:N0}đ vào ví.",
                    DataJson = "{}",
                    Channel = "InApp"
                }, cancellationToken);
                
                return;
            }

            // The rest is for Booking payments
            if (!payment.BookingId.HasValue)
            {
                _logger.LogError("Payment {PaymentId} has no BookingId.", payment.Id);
                return;
            }

            var booking = await _bookingRepo.GetByIdAsync(payment.BookingId.Value, cancellationToken);
            if (booking == null)
            {
                _logger.LogError("Booking {BookingId} for Payment {PaymentId} not found.", payment.BookingId, payment.Id);
                return;
            }

            var paymentTx = new WalletTransaction
            {
                WalletId = customerWallet.Id,
                Type = WalletTransactionType.BookingPayment,
                Amount = -data.Amount, 
                BalanceAfter = customerWallet.Balance - data.Amount,
                ReferenceId = booking.Id,
                IdempotencyKey = $"bookingpayment_{payment.Id}",
                Note = $"Thanh toán cọc cho booking {booking.BookingCode}"
            };
            await _walletRepo.AddTransactionAsync(paymentTx, cancellationToken);
            customerWallet.Balance -= data.Amount;
            customerWallet.TotalSpent += data.Amount;
            _walletRepo.Update(customerWallet);

            // 2.5. Owner Wallet Operations - Credit deposit minus platform fee immediately
            var ownerEarning = booking.DepositAmount - booking.PlatformFee;
            var ownerWallets = await _walletRepo.FindAsync(w => w.UserId == booking.OwnerId, cancellationToken);
            var ownerWallet = ownerWallets.FirstOrDefault();
            if (ownerWallet == null)
            {
                ownerWallet = new Wallet { UserId = booking.OwnerId, Balance = 0, TotalEarned = 0, TotalSpent = 0 };
                await _walletRepo.AddAsync(ownerWallet, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            var ownerTx = new WalletTransaction
            {
                WalletId = ownerWallet.Id,
                Type = WalletTransactionType.BookingEarning,
                Amount = ownerEarning,
                BalanceAfter = ownerWallet.Balance + ownerEarning,
                ReferenceId = booking.Id,
                IdempotencyKey = $"booking_earning_{booking.Id}",
                Note = $"Thu nhập từ booking {booking.BookingCode} (Đặt cọc: {booking.DepositAmount:N0}đ, Phí: {booking.PlatformFee:N0}đ)",
                Status = "Completed"
            };
            await _walletRepo.AddTransactionAsync(ownerTx, cancellationToken);
            ownerWallet.Balance += ownerEarning;
            if (ownerEarning > 0)
                ownerWallet.TotalEarned += ownerEarning;
            else
                ownerWallet.TotalSpent += Math.Abs(ownerEarning);
            _walletRepo.Update(ownerWallet);

            // 3. Update Booking Status
            var oldStatus = booking.Status;
            booking.Status = "DepositPaid";
            booking.UpdatedAt = DateTime.UtcNow;
            _bookingRepo.Update(booking);

            await _bookingRepo.AddStatusHistoryAsync(new BookingStatusHistory
            {
                BookingId = booking.Id,
                FromStatus = oldStatus,
                ToStatus = "DepositPaid",
                ChangedBy = payment.PayerId, 
                Note = "Hệ thống xác nhận đã nhận cọc qua PayOS",
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Cancel overlapping bookings
            var overlapping = await _bookingRepo.GetOverlappingBookingsAsync(booking.VehicleId, booking.StartDate, booking.EndDate, booking.Id, cancellationToken);
            foreach (var overlap in overlapping)
            {
                var oldOverlapStatus = overlap.Status;
                overlap.Status = "Cancelled";
                overlap.CancelReason = "Xe đã có khách khác thanh toán cọc thành công.";
                overlap.CancelledAt = DateTime.UtcNow;
                overlap.UpdatedAt = DateTime.UtcNow;
                _bookingRepo.Update(overlap);

                await _bookingRepo.AddStatusHistoryAsync(new BookingStatusHistory
                {
                    BookingId = overlap.Id,
                    FromStatus = oldOverlapStatus,
                    ToStatus = "Cancelled",
                    ChangedBy = payment.PayerId,
                    Note = "Hệ thống tự động hủy do trùng lịch",
                }, cancellationToken);

                await NotifyUserAsync(
                    overlap.CustomerId,
                    overlap,
                    "Booking bị hủy do trùng lịch",
                    $"{overlap.BookingCode}: Xe đã có người khác đặt cọc trước. Bạn có thể tìm xe khác nhé.",
                    "customer",
                    $"/booking/{overlap.Id}",
                    "BookingCancelled",
                    cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Send notifications outside transaction
            await NotifyUserAsync(
                booking.OwnerId,
                booking,
                "Khách hàng đã thanh toán cọc",
                $"{booking.BookingCode}: Khách hàng đã thanh toán cọc thành công qua PayOS.",
                "owner",
                $"/booking/{booking.Id}",
                "BookingDepositPaid",
                cancellationToken);

            await NotifyUserAsync(
                booking.CustomerId,
                booking,
                "Thanh toán cọc thành công",
                $"{booking.BookingCode}: Bạn đã thanh toán cọc thành công.",
                "customer",
                $"/booking/{booking.Id}",
                "BookingDepositPaid",
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process payment webhook for OrderCode {OrderCode}", data.OrderCode);
            throw;
        }
        finally
        {
            await _lockService.ReleaseLockAsync(lockHandle, cancellationToken);
        }
    }

    private async Task NotifyUserAsync(
        long userId,
        Booking booking,
        string title,
        string body,
        string roleTarget,
        string targetPath,
        string action,
        CancellationToken cancellationToken)
    {
        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = userId,
            Type = "Payment",
            Title = title,
            Body = body,
            DataJson = JsonSerializer.Serialize(new
            {
                bookingId = booking.Id,
                bookingCode = booking.BookingCode,
                vehicleId = booking.VehicleId,
                status = booking.Status,
                roleTarget,
                targetPath,
                action
            }),
            Channel = "InApp"
        }, cancellationToken);
    }

    public async Task<CreatePaymentLinkResponse> CreateTopUpPaymentLinkAsync(long userId, decimal amount, CancellationToken cancellationToken = default)
    {
        var walletId = (await _walletRepo.FindAsync(w => w.UserId == userId, cancellationToken)).FirstOrDefault()?.Id;
        if (walletId == null)
        {
            var wallet = new Wallet { UserId = userId, Balance = 0, TotalEarned = 0, TotalSpent = 0 };
            await _walletRepo.AddAsync(wallet, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            walletId = wallet.Id;
        }

        var orderCode = long.Parse(DateTimeOffset.UtcNow.ToString("yyMMddHHmmss") + new Random().Next(10, 99));

        var payment = new Payment
        {
            OrderCode = orderCode,
            Amount = amount,
            Status = PaymentStatus.Pending,
            Type = "TopUp", 
            BookingId = null, // Since there is no booking
            PayerId = userId,
            Gateway = "PayOS",
            IdempotencyKey = Guid.NewGuid().ToString()
        };

        await _paymentRepo.AddAsync(payment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var paymentLinkRequest = new CreatePaymentLinkInput
        {
            OrderCode = orderCode,
            Amount = (int)amount,
            Description = $"Nap tien vi",
            Items = new List<PaymentItemInput>
            {
                new PaymentItemInput("Nap tien vao vi MoveVN", 1, (int)amount)
            },
            ExpireAfterMinutes = 30
        };

        var payOsResponse = await _payOsService.CreatePaymentLinkAsync(paymentLinkRequest);

        payment.GatewayTransactionId = payOsResponse.PaymentLinkId;
        _paymentRepo.Update(payment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreatePaymentLinkResponse(
            payOsResponse.CheckoutUrl,
            payOsResponse.QrCode,
            orderCode,
            payOsResponse.PaymentLinkId
        );
    }
}
