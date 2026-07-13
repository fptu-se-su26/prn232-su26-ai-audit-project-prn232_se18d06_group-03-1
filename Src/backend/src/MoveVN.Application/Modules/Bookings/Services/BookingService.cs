using System.Text.Json;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Bookings.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _repo;
    private readonly IEmailSender _emailSender;
    private readonly IUserRepository _userRepo;
    private readonly IBookingRiskScorer _bookingRiskScorer;
    private readonly INotificationService _notificationService;
    private readonly IRedisLockService _redisLockService;
    private readonly ICustomerDriverLicenseRepository _customerLicenseRepo;
    private readonly IWalletRepository _walletRepo;

    private static readonly (int MinDays, int MaxDays, decimal DiscountPercent)[] RentalDiscountTiers =
    {
        (3, 3, 5m),
        (5, 6, 10m),
        (7, 29, 15m),
        (30, int.MaxValue, 25m),
    };

    public BookingService(
        IBookingRepository repo,
        IEmailSender emailSender,
        IUserRepository userRepo,
        IBookingRiskScorer bookingRiskScorer,
        INotificationService notificationService,
        IRedisLockService redisLockService,
        ICustomerDriverLicenseRepository customerLicenseRepo,
        IWalletRepository walletRepo)
    {
        _repo = repo;
        _emailSender = emailSender;
        _userRepo = userRepo;
        _bookingRiskScorer = bookingRiskScorer;
        _notificationService = notificationService;
        _redisLockService = redisLockService;
        _customerLicenseRepo = customerLicenseRepo;
        _walletRepo = walletRepo;
    }

    public async Task<BookingResponse> CreateAsync(CreateBookingRequest request, long customerId, CancellationToken cancellationToken = default)
    {
        // Normalize DateTime.Kind to Utc for Npgsql timestamp with time zone compatibility
        request.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
        request.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);

        if (request.StartDate.Date < DateTime.UtcNow.Date)
            throw new ValidationException(new[] { "Ngày nhận xe không được ở quá khứ." });

        if (request.EndDate <= request.StartDate)
            throw new ValidationException(new[] { "Ngày trả phải sau ngày nhận." });

        var vehicle = await _repo.GetVehicleByIdAsync(request.VehicleId, cancellationToken)
            ?? throw new NotFoundException("Xe không tồn tại.");

        if (vehicle.Status != "Approved")
            throw new ValidationException(new[] { "Xe không có sẵn để đặt." });

        var profile = await _repo.GetCustomerProfileByUserIdAsync(customerId, cancellationToken);
        if (profile?.NationalIdVerified != true)
            throw new ValidationException(new[] { "Ban can xac thuc CCCD truoc khi dat xe." });

        if (profile.DriverLicenseVerified != true)
            throw new ValidationException(new[] { "Ban can xac thuc giay phep lai xe truoc khi dat xe." });

        var customerLicense = await _customerLicenseRepo.GetByUserIdAndVehicleTypeAsync(customerId, vehicle.VehicleType, cancellationToken);
        if (customerLicense is null)
            throw new ValidationException(new[] { "Ban chua xac thuc giay phep lai xe cho loai xe nay." });

        if (vehicle.VariantId.HasValue)
        {
            var variant = await _repo.GetVariantByIdAsync(vehicle.VariantId.Value, cancellationToken);
            if (variant?.RequiredLicenseClassId is not null)
            {
                var compatible = await _repo.IsLicenseClassCompatibleAsync(customerLicense.LicenseClass!, variant.RequiredLicenseClassId.Value, cancellationToken);
                if (!compatible)
                    throw new ValidationException(new[] { "Hang bang lai cua ban khong phu hop voi loai xe nay." });
            }
        }

        // Redis lock to prevent double booking race condition
        var @lock = await _redisLockService.AcquireLockAsync(
            $"booking:create:{request.VehicleId}",
            TimeSpan.FromSeconds(30),
            cancellationToken);

        if (@lock is null)
            throw new AppException(ErrorCode.REDIS_LOCK_FAILED);

        try
        {
            var hasOverlap = await _repo.HasOverlapAsync(request.VehicleId, request.StartDate, request.EndDate, null, cancellationToken);
            if (hasOverlap)
            {
                var nextAvailable = await GetNextAvailableDateAsync(request.VehicleId, request.StartDate, request.EndDate, cancellationToken);
                throw new AppException(ErrorCode.BOOKING_OVERLAP, data: nextAvailable.HasValue
                    ? new { nextAvailable = nextAvailable.Value.ToString("yyyy-MM-dd") }
                    : null);
            }

        var totalDays = Math.Max(1, (int)Math.Ceiling((request.EndDate - request.StartDate).TotalDays));
        if (totalDays <= 0)
            throw new ValidationException(new[] { "Thời gian thuê phải ít nhất 1 ngày." });

        var basePrice = vehicle.PricePerDay * totalDays;
        var discountPercent = GetDiscountPercent(totalDays);
        var discountAmount = Math.Round(basePrice * discountPercent / 100, 0);
        var afterDiscount = basePrice - discountAmount;
        var platformFee = Math.Round(afterDiscount * 10 / 100, 0);
        var depositAmount = vehicle.DepositPercent > 0
            ? Math.Round(afterDiscount * vehicle.DepositPercent / 100, 0)
            : 0;
        var totalAmount = afterDiscount + platformFee;
        var createdAt = DateTime.UtcNow;
        var risk = await CalculateBookingRiskAsync(
            customerId,
            request.StartDate,
            totalDays,
            totalAmount,
            depositAmount,
            vehicle.DepositPercent > 0,
            createdAt,
            null,
            cancellationToken);

        var booking = new Booking
        {
            BookingCode = GenerateCode(),
            CustomerId = customerId,
            VehicleId = request.VehicleId,
            OwnerId = vehicle.OwnerId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalDays = totalDays,
            BasePrice = basePrice,
            PlatformFee = platformFee,
            DepositAmount = depositAmount,
            TotalAmount = totalAmount,
            PickupAddress = request.PickupAddress,
            ReturnAddress = request.ReturnAddress ?? request.PickupAddress,
            CustomerNote = request.CustomerNote,
            Status = "Pending",
            RiskScore = risk.Score,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
            PlatformFeeType = "Percentage",
            PlatformFeeValue = 10m,
        };

        await _repo.AddAsync(booking, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = null,
            ToStatus = "Pending",
            ChangedBy = customerId,
            Note = "Customer tạo booking",
        }, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

            await NotifyUserAsync(
                booking.OwnerId,
                booking,
                "Booking moi can xu ly",
                $"{booking.BookingCode}: Khach hang vua gui yeu cau dat xe.",
                "owner",
                $"/owner/bookings/{booking.Id}",
                "BookingCreated",
                cancellationToken);

            return await MapAsync(booking, cancellationToken);
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(@lock, cancellationToken);
        }
    }

    public async Task<BookingResponse> GetByIdAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");
        return await MapAsync(booking, cancellationToken);
    }

    public async Task<(List<BookingResponse> Items, int TotalCount)> GetMyBookingsAsync(long userId, BookingListRequest request, CancellationToken cancellationToken = default)
    {
        return await _repo.GetByCustomerPagedAsync(userId, request, cancellationToken);
    }

    public async Task<(List<BookingResponse> Items, int TotalCount)> GetOwnerBookingsAsync(long ownerId, BookingListRequest request, CancellationToken cancellationToken = default)
    {
        return await _repo.GetByOwnerPagedAsync(ownerId, request, cancellationToken);
    }

    public async Task<BookingResponse> ApproveAsync(long bookingId, long ownerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền xử lý booking này." });

        if (booking.Status != "Pending")
            throw new ValidationException(new[] { "Chỉ có thể duyệt booking đang chờ." });

        var hasOverlap = await _repo.HasOverlapAsync(booking.VehicleId, booking.StartDate, booking.EndDate, booking.Id, cancellationToken);
        if (hasOverlap)
            throw new ValidationException(new[] { "Xe đã có người đặt trong khoảng thời gian này, không thể duyệt." });

        var oldStatus = booking.Status;
        booking.Status = "Approved";
        booking.UpdatedAt = DateTime.UtcNow;
        _repo.Update(booking);

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = oldStatus,
            ToStatus = "Approved",
            ChangedBy = ownerId,
        }, cancellationToken);

        await _repo.SaveChangesAsync(cancellationToken);

        await NotifyUserAsync(
            booking.CustomerId,
            booking,
            "Booking da duoc duyet",
            $"{booking.BookingCode} da duoc chu xe duyet.",
            "customer",
            $"/booking/{booking.Id}",
            "BookingApproved",
            cancellationToken);

        // Send email to remind customer to pay deposit
        var customer = await _userRepo.GetByIdAsync(booking.CustomerId, cancellationToken);
        if (customer != null && !string.IsNullOrWhiteSpace(customer.Email))
        {
            var vehicle = await _repo.GetVehicleByIdAsync(booking.VehicleId, cancellationToken);
            var vehicleName = vehicle != null ? $"{vehicle.BrandId} {vehicle.Year}" : "Xe";

            try
            {
                await _emailSender.SendDepositRequestAsync(
                    customer.Email,
                    customer.FullName ?? "Khách hàng",
                    booking.BookingCode,
                    vehicleName,
                    booking.DepositAmount,
                    cancellationToken
                );
            }
            catch
            {
                // Ignore email failure to avoid breaking the approve flow
            }
        }

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> RejectAsync(long bookingId, long ownerId, RejectBookingRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new ValidationException(new[] { "Vui lòng nhập lý do từ chối." });

        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền xử lý booking này." });

        if (booking.Status != "Pending")
            throw new ValidationException(new[] { "Booking không ở trạng thái có thể từ chối." });

        var oldStatus = booking.Status;
        booking.Status = "Rejected";
        booking.CancelReason = request.Reason;
        booking.CancelledAt = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;
        _repo.Update(booking);

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = oldStatus,
            ToStatus = "Rejected",
            ChangedBy = ownerId,
            Note = request.Reason,
        }, cancellationToken);

        // Refund deposit to customer wallet if already paid
        if (oldStatus == "DepositPaid" && booking.DepositAmount > 0)
        {
            try
            {
                var wallets = await _walletRepo.FindAsync(w => w.UserId == booking.CustomerId, cancellationToken);
                var wallet = wallets.FirstOrDefault();
                if (wallet != null)
                {
                    wallet.Balance += booking.DepositAmount;
                    _walletRepo.Update(wallet);

                    await _walletRepo.AddTransactionAsync(new WalletTransaction
                    {
                        WalletId = wallet.Id,
                        Type = WalletTransactionType.Refund,
                        Amount = booking.DepositAmount,
                        BalanceAfter = wallet.Balance,
                        ReferenceId = booking.Id,
                        IdempotencyKey = $"refund_booking_{booking.Id}",
                        Note = $"Hoàn cọc booking {booking.BookingCode} do chủ xe từ chối",
                    }, cancellationToken);
                }
            }
            catch
            {
                // Refund failure should not block the rejection
            }
        }

        await _repo.SaveChangesAsync(cancellationToken);

        await NotifyUserAsync(
            booking.CustomerId,
            booking,
            "Booking da bi tu choi",
            $"{booking.BookingCode} da bi chu xe tu choi. Ly do: {request.Reason.Trim()}",
            "customer",
            $"/booking/{booking.Id}",
            "BookingRejected",
            cancellationToken);

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> CompleteAsync(long bookingId, long customerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(new[] { "Bạn không có quyền xác nhận hoàn tất booking này." });

        if (booking.Status != "DepositPaid" && booking.Status != "Confirmed")
            throw new ValidationException(new[] { "Booking chưa thể hoàn tất." });

        var oldStatus = booking.Status;
        booking.Status = "Completed";
        booking.UpdatedAt = DateTime.UtcNow;
        _repo.Update(booking);

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = oldStatus,
            ToStatus = "Completed",
            ChangedBy = customerId,
            Note = "Khách hàng xác nhận đã hoàn tất chuyến đi",
        }, cancellationToken);

        await _repo.SaveChangesAsync(cancellationToken);
        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> ConfirmDepositAsync(long bookingId, long customerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(new[] { "Bạn không có quyền xác nhận cọc cho booking này." });

        if (booking.Status != "Approved")
            throw new ValidationException(new[] { "Booking chưa được duyệt, không thể thanh toán cọc." });

        var oldStatus = booking.Status;
        booking.Status = "DepositPaid";
        booking.UpdatedAt = DateTime.UtcNow;
        _repo.Update(booking);

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = oldStatus,
            ToStatus = "DepositPaid",
            ChangedBy = customerId,
            Note = "Khách hàng xác nhận đã chuyển cọc",
        }, cancellationToken);

        // Cancel overlapping bookings
        var overlapping = await _repo.GetOverlappingBookingsAsync(booking.VehicleId, booking.StartDate, booking.EndDate, booking.Id, cancellationToken);
        foreach (var overlap in overlapping)
        {
            var oldOverlapStatus = overlap.Status;
            overlap.Status = "Cancelled";
            overlap.CancelReason = "Xe đã có khách khác thanh toán cọc thành công.";
            overlap.CancelledAt = DateTime.UtcNow;
            overlap.UpdatedAt = DateTime.UtcNow;
            _repo.Update(overlap);

            await _repo.AddStatusHistoryAsync(new BookingStatusHistory
            {
                BookingId = overlap.Id,
                FromStatus = oldOverlapStatus,
                ToStatus = "Cancelled",
                ChangedBy = customerId,
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

        await _repo.SaveChangesAsync(cancellationToken);

        await NotifyUserAsync(
            booking.OwnerId,
            booking,
            "Khach hang da xac nhan coc",
            $"{booking.BookingCode}: Khach hang da xac nhan da chuyen coc.",
            "owner",
            $"/booking/{booking.Id}",
            "BookingDepositConfirmed",
            cancellationToken);

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> OwnerCompleteAsync(long bookingId, long ownerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền hoàn thành booking này." });

        if (booking.Status != "DepositPaid")
            throw new ValidationException(new[] { "Chỉ có thể hoàn thành những booking đã thanh toán cọc." });

        var oldStatus = booking.Status;
        booking.Status = "Completed";
        booking.UpdatedAt = DateTime.UtcNow;
        _repo.Update(booking);

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = oldStatus,
            ToStatus = "Completed",
            ChangedBy = ownerId,
            Note = "Chủ xe xác nhận hoàn thành chuyến đi",
        }, cancellationToken);

        // Calculate Owner's share: DepositAmount - PlatformFee
        var ownerEarning = booking.DepositAmount - booking.PlatformFee;

        // Find or create Owner's Wallet
        var ownerWallets = await _walletRepo.FindAsync(w => w.UserId == ownerId, cancellationToken);
        var ownerWallet = ownerWallets.FirstOrDefault();
        if (ownerWallet == null)
        {
            ownerWallet = new Wallet { UserId = ownerId, Balance = 0, TotalEarned = 0, TotalSpent = 0 };
            await _walletRepo.AddAsync(ownerWallet, cancellationToken);
            await _repo.SaveChangesAsync(cancellationToken);
        }

        var tx = new WalletTransaction
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
        await _walletRepo.AddTransactionAsync(tx, cancellationToken);

        ownerWallet.Balance += ownerEarning;
        if (ownerEarning > 0)
        {
            ownerWallet.TotalEarned += ownerEarning;
        }
        else
        {
            ownerWallet.TotalSpent += Math.Abs(ownerEarning);
        }
        _walletRepo.Update(ownerWallet);

        await _repo.SaveChangesAsync(cancellationToken);

        // Notify customer
        await NotifyUserAsync(
            booking.CustomerId,
            booking,
            "Chuyến đi đã hoàn thành",
            $"{booking.BookingCode}: Chủ xe đã xác nhận hoàn thành chuyến đi.",
            "customer",
            $"/booking/{booking.Id}",
            "BookingCompleted",
            cancellationToken);

        // Notify owner
        var earningText = ownerEarning >= 0 ? $"+{ownerEarning:N0}đ" : $"-{Math.Abs(ownerEarning):N0}đ";
        await NotifyUserAsync(
            booking.OwnerId,
            booking,
            "Hoàn thành booking thành công",
            $"{booking.BookingCode}: Bạn đã xác nhận hoàn thành chuyến đi. Số dư ví thay đổi {earningText}.",
            "owner",
            $"/booking/{booking.Id}",
            "BookingCompleted",
            cancellationToken);

        return await MapAsync(booking, cancellationToken);
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
            Type = "Booking",
            Title = title,
            Body = body,
            DataJson = JsonSerializer.Serialize(new
            {
                bookingId = booking.Id,
                bookingCode = booking.BookingCode,
                vehicleId = booking.VehicleId,
                status = booking.Status,
                riskScore = booking.RiskScore,
                roleTarget,
                targetPath,
                action
            }),
            Channel = "InApp"
        }, cancellationToken);
    }

    private static decimal GetDiscountPercent(int totalDays)
    {
        foreach (var tier in RentalDiscountTiers.OrderByDescending(t => t.MinDays))
        {
            if (totalDays >= tier.MinDays && totalDays <= tier.MaxDays)
                return tier.DiscountPercent;
        }
        return 0;
    }

    private static string GenerateCode()
    {
        var now = DateTime.UtcNow;
        return $"BK{now:yyyyMMdd}{Random.Shared.Next(1000, 9999)}";
    }

    private async Task<BookingRiskResult> CalculateBookingRiskAsync(
        long customerId,
        DateTime startDate,
        int totalDays,
        decimal totalAmount,
        decimal depositAmount,
        bool vehicleRequiresDeposit,
        DateTime bookingCreatedAt,
        long? currentBookingId,
        CancellationToken cancellationToken)
    {
        var customer = await _userRepo.GetByIdAsync(customerId, cancellationToken)
            ?? throw new NotFoundException("KhÃ¡ch hÃ ng khÃ´ng tá»“n táº¡i.");
        var profile = await _repo.GetCustomerProfileByUserIdAsync(customerId, cancellationToken);
        var trustScore = await _repo.GetTrustScoreByUserIdAsync(customerId, cancellationToken);
        var activeBookingCount = await _repo.CountActiveBookingsByCustomerAsync(customerId, currentBookingId, cancellationToken);
        var recentBookingCount = await _repo.CountRecentBookingsByCustomerAsync(
            customerId,
            bookingCreatedAt.AddDays(-7),
            currentBookingId,
            cancellationToken);

        return _bookingRiskScorer.Calculate(new BookingRiskContext
        {
            CustomerId = customerId,
            CustomerCreatedAt = customer.CreatedAt,
            IsEmailVerified = customer.IsEmailVerified,
            IsNationalIdVerified = profile?.NationalIdVerified == true,
            IsDriverLicenseVerified = profile?.DriverLicenseVerified == true,
            TrustScore = trustScore?.Score,
            CompletedTrips = trustScore?.CompletedTrips ?? 0,
            CancellationCount = trustScore?.CancellationCount ?? 0,
            ReportCount = trustScore?.ReportCount ?? 0,
            AverageRating = trustScore?.AverageRating,
            ActiveBookingCount = activeBookingCount,
            RecentBookingCount7Days = recentBookingCount,
            BookingCreatedAt = bookingCreatedAt,
            StartDate = startDate,
            TotalDays = totalDays,
            TotalAmount = totalAmount,
            DepositAmount = depositAmount,
            VehicleRequiresDeposit = vehicleRequiresDeposit,
        });
    }

    private async Task<DateOnly?> GetNextAvailableDateAsync(long vehicleId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken)
    {
        return await _repo.GetNextAvailableDateAsync(vehicleId, startDate, endDate, cancellationToken);
    }

    private async Task<BookingResponse> MapAsync(Booking b, CancellationToken cancellationToken)
    {
        var history = await _repo.GetStatusHistoryAsync(b.Id, cancellationToken);
        var vehicle = await _repo.GetVehicleByIdAsync(b.VehicleId, cancellationToken);
        var risk = await CalculateBookingRiskAsync(
            b.CustomerId,
            b.StartDate,
            b.TotalDays,
            b.TotalAmount,
            b.DepositAmount,
            vehicle?.DepositPercent > 0,
            b.CreatedAt,
            b.Id,
            cancellationToken);

        var basePrice = b.BasePrice;
        var discountPercent = GetDiscountPercent(b.TotalDays);
        var discountAmount = Math.Round(basePrice * discountPercent / 100, 0);

        return new BookingResponse
        {
            Id = b.Id,
            BookingCode = b.BookingCode,
            CustomerId = b.CustomerId,
            VehicleId = b.VehicleId,
            VehicleName = vehicle is null ? null : $"{vehicle.BrandId} {vehicle.Year}",
            OwnerId = b.OwnerId,
            StartDate = b.StartDate,
            EndDate = b.EndDate,
            TotalDays = b.TotalDays,
            BasePrice = b.BasePrice,
            DiscountPercent = discountPercent,
            DiscountAmount = discountAmount,
            PlatformFee = b.PlatformFee,
            DepositAmount = b.DepositAmount,
            TotalAmount = b.TotalAmount,
            PickupAddress = b.PickupAddress,
            ReturnAddress = b.ReturnAddress,
            CustomerNote = b.CustomerNote,
            Status = b.Status,
            RiskScore = b.RiskScore,
            RiskLevel = risk.Level,
            RiskFactors = risk.Factors,
            CancelReason = b.CancelReason,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt,
            StatusHistory = history,
        };
    }
}
