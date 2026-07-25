using System.Text.Json;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Helpers;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;
using MoveVN.Application.Modules.Disputes.Interfaces;
using MoveVN.Application.Modules.Disputes.Services;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Application.Modules.Promotions.Interfaces;
using MoveVN.Application.Modules.Promotions.DTOs;
using Microsoft.Extensions.Logging;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Modules.Bookings.Services;

public class BookingService : IBookingService
{
    private static readonly TimeSpan DepositPaymentWindow = TimeSpan.FromHours(2);
    private readonly IBookingRepository _repo;
    private readonly IEmailSender _emailSender;
    private readonly IUserRepository _userRepo;
    private readonly IBookingRiskScorer _bookingRiskScorer;
    private readonly INotificationService _notificationService;
    private readonly IRedisLockService _redisLockService;
    private readonly ICustomerDriverLicenseRepository _customerLicenseRepo;
    private readonly IBookingWalletService _walletService;
    private readonly IDisputeRepository _disputeRepository;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IVehicleCatalogRepository _catalogRepository;
    private readonly IPromotionRepository _promoRepo;
    private readonly ILogger<BookingService> _logger;

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
        IBookingWalletService walletService,
        IDisputeRepository disputeRepository,
        ICloudinaryService cloudinaryService,
        IVehicleCatalogRepository catalogRepository,
        IPromotionRepository promoRepo,
        ILogger<BookingService> logger)
    {
        _repo = repo;
        _emailSender = emailSender;
        _userRepo = userRepo;
        _bookingRiskScorer = bookingRiskScorer;
        _notificationService = notificationService;
        _redisLockService = redisLockService;
        _customerLicenseRepo = customerLicenseRepo;
        _walletService = walletService;
        _disputeRepository = disputeRepository;
        _cloudinaryService = cloudinaryService;
        _catalogRepository = catalogRepository;
        _promoRepo = promoRepo;
        _logger = logger;
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
        // The listed rental price already includes the platform fee. Keep the
        // customer-facing total unchanged and only split the fee internally.
        var totalAmount = afterDiscount;
        var feeRule = await _catalogRepository.GetActivePlatformFeeRuleAsync(vehicle.OwnerId, DateTime.UtcNow, cancellationToken);
        if (feeRule is null)
            throw new ValidationException(new[] { "Chua cau hinh quy tac phi nen tang dang hoat dong." });
        var platformFeeType = feeRule.FeeType;
        var platformFeeValue = feeRule.FeeValue;
        var platformFee = CalculatePlatformFee(totalAmount, platformFeeType, platformFeeValue, feeRule.MinFee, feeRule.MaxFee);
        var effectiveDepositPercent = Math.Clamp(vehicle.DepositPercent, 20, 100);
        var depositAmount = Math.Round(totalAmount * effectiveDepositPercent / 100, 0);

        long? promoId = null;
        string? promoCode = null;
        decimal promoDiscount = 0;
        if (!string.IsNullOrWhiteSpace(request.PromotionCode))
        {
            var promoCodeTrimmed = request.PromotionCode.Trim().ToUpperInvariant();
            var promo = await _promoRepo.GetByCodeAsync(promoCodeTrimmed, cancellationToken);
            if (promo is null)
                throw new ValidationException(["Mã khuyến mãi không tồn tại."]);
            if (!promo.IsActive)
                throw new ValidationException(["Mã khuyến mãi đã bị vô hiệu hóa."]);
            if (promo.StartAt > DateTime.UtcNow)
                throw new ValidationException(["Mã khuyến mãi chưa đến hạn sử dụng."]);
            if (promo.EndAt.HasValue && promo.EndAt.Value < DateTime.UtcNow)
                throw new ValidationException(["Mã khuyến mãi đã hết hạn."]);
            if (promo.UsageCount >= promo.MaxUsageCount)
                throw new ValidationException(["Mã khuyến mãi đã hết lượt sử dụng."]);
            if (promo.MinOrderAmount.HasValue && totalAmount < promo.MinOrderAmount.Value)
                throw new ValidationException([$"Đơn hàng tối thiểu {promo.MinOrderAmount.Value:N0}đ để sử dụng mã này."]);

            if (promo.VehicleType != "All")
            {
                if (promo.VehicleType == "Motorbike" && vehicle.VehicleType != "Motorbike")
                    throw new ValidationException(["Mã này chỉ áp dụng cho xe máy."]);
                if (promo.VehicleType == "Car" && vehicle.VehicleType != "Car")
                    throw new ValidationException(["Mã này chỉ áp dụng cho ô tô."]);
            }

            if (promo.WhoBears == "Owner" && promo.OwnerId.HasValue && vehicle.OwnerId != promo.OwnerId.Value)
                throw new ValidationException(["Mã này không áp dụng cho xe này."]);

            promoDiscount = promo.DiscountType == "Fixed"
                ? promo.DiscountValue
                : Math.Round(totalAmount * promo.DiscountValue / 100m, 0);
            if (promo.MaxDiscountAmount.HasValue && promoDiscount > promo.MaxDiscountAmount.Value)
                promoDiscount = promo.MaxDiscountAmount.Value;
            promoDiscount = Math.Min(promoDiscount, totalAmount);

            promoId = promo.Id;
            promoCode = promo.Code;
            totalAmount -= promoDiscount;
            depositAmount = Math.Round(totalAmount * effectiveDepositPercent / 100, 0);

            promo.UsageCount++;
            _promoRepo.Update(promo);
        }
        var createdAt = DateTime.UtcNow;
        var risk = await CalculateBookingRiskAsync(
            customerId,
            request.StartDate,
            totalDays,
            totalAmount,
            depositAmount,
            true,
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
            PlatformFeeRuleId = feeRule.Id,
            PlatformFeeType = platformFeeType,
            PlatformFeeValue = platformFeeValue,
            EscrowStatus = "None",
            SecurityDepositAmount = vehicle.SecurityRequiresDeposit ? vehicle.SecurityDepositAmount : 0,
            PromotionId = promoId,
            PromotionCode = promoCode,
            PromotionDiscount = promoDiscount,
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

        if (promoId.HasValue)
        {
            decimal systemPaid = 0;
            decimal ownerPaid = 0;
            var promo2 = await _promoRepo.GetByIdAsync(promoId.Value, cancellationToken);
            if (promo2 is not null)
            {
                switch (promo2.WhoBears)
                {
                    case "System": systemPaid = promoDiscount; break;
                    case "Owner": ownerPaid = promoDiscount; break;
                    case "Shared":
                        var ownerPct = promo2.OwnerBearsPercent ?? 50m;
                        ownerPaid = Math.Round(promoDiscount * ownerPct / 100m, 0);
                        systemPaid = promoDiscount - ownerPaid;
                        break;
                }
            }
            await _promoRepo.AddUsageAsync(new PromotionUsage
            {
                PromotionId = promoId.Value,
                BookingId = booking.Id,
                UserId = customerId,
                DiscountAmount = promoDiscount,
                SystemPaidAmount = systemPaid,
                OwnerPaidAmount = ownerPaid,
            }, cancellationToken);
            await _promoRepo.SaveChangesAsync(cancellationToken);
        }

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
        NormalizeListRequest(request);
        return await _repo.GetByCustomerPagedAsync(userId, request, cancellationToken);
    }

    public async Task<(List<BookingResponse> Items, int TotalCount)> GetOwnerBookingsAsync(long ownerId, BookingListRequest request, CancellationToken cancellationToken = default)
    {
        NormalizeListRequest(request);
        return await _repo.GetByOwnerPagedAsync(ownerId, request, cancellationToken);
    }

    private static void NormalizeListRequest(BookingListRequest request)
    {
        request.Page = Math.Max(request.Page, 1);
        request.PageSize = Math.Clamp(request.PageSize, 5, 50);

        if (request.FromDate.HasValue && request.ToDate.HasValue && request.FromDate > request.ToDate)
            throw new ValidationException(["Ngày bắt đầu bộ lọc không được sau ngày kết thúc."]);
    }

    public async Task<BookingResponse> ApproveAsync(long bookingId, long ownerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền xử lý booking này." });

        if (booking.Status != "Pending")
            throw new ValidationException(new[] { "Booking không ở trạng thái chờ duyệt." });

        if (booking.StartDate <= DateTime.UtcNow)
            throw new ValidationException(["Đã đến giờ nhận xe, booking không thể được duyệt."]);

        var hasOverlap = await _repo.HasOverlapAsync(booking.VehicleId, booking.StartDate, booking.EndDate, booking.Id, cancellationToken);
        if (hasOverlap)
            throw new ValidationException(new[] { "Xe đã có người đặt trong khoảng thời gian này, không thể duyệt." });

        var oldStatus = booking.Status;
        booking.Status = "Approved";
        booking.PaymentDueAt = new[] { DateTime.UtcNow.Add(DepositPaymentWindow), booking.StartDate }.Min();
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

        try
        {
            var customer = await _userRepo.GetByIdAsync(booking.CustomerId, cancellationToken);
            var vehicle = await _repo.GetVehicleByIdAsync(booking.VehicleId, cancellationToken);
            if (customer is not null && vehicle is not null)
            {
                var vehicleName = $"{vehicle.BrandId} {vehicle.Year}";
                await _emailSender.SendDepositRequestAsync(
                    customer.Email,
                    customer.FullName,
                    booking.BookingCode,
                    vehicleName,
                    booking.DepositAmount,
                    cancellationToken
                );
            }
        }
        catch
        {
            // Email failure should not block the approval
        }

        await NotifyUserAsync(
            booking.CustomerId,
            booking,
            "Booking da duoc duyet",
            booking.DepositAmount > 0
                ? $"{booking.BookingCode} da duoc chu xe duyet. Vui long xac nhan tien coc."
                : $"{booking.BookingCode} da duoc chu xe duyet.",
            "customer",
            $"/customer/bookings/{booking.Id}",
            "BookingApproved",
            cancellationToken);

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
            throw new ValidationException(new[] { "Booking không ở trạng thái chờ duyệt." });

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

        await _repo.SaveChangesAsync(cancellationToken);

        await NotifyUserAsync(
            booking.CustomerId,
            booking,
            "Booking da bi tu choi",
            $"{booking.BookingCode} da bi chu xe tu choi. Ly do: {request.Reason.Trim()}",
            "customer",
            $"/customer/bookings/{booking.Id}",
            "BookingRejected",
            cancellationToken);

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingCancellationQuote> GetCancellationQuoteAsync(long bookingId, long customerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(["Bạn không có quyền hủy booking này."]);

        var paidDeposit = await _walletService.GetPaidDepositAmountAsync(booking.Id, cancellationToken);
        return _walletService.BuildCancellationQuote(booking, paidDeposit, DateTime.UtcNow);
    }

    public async Task<BookingResponse> CancelByCustomerAsync(
        long bookingId,
        long customerId,
        CancelBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        var lockHandle = await _redisLockService.AcquireLockAsync(
            $"booking:cancel:{bookingId}",
            TimeSpan.FromSeconds(30),
            cancellationToken);

        if (lockHandle is null)
            throw new AppException(ErrorCode.REDIS_LOCK_FAILED);

        try
        {
            var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
                ?? throw new NotFoundException("Booking không tồn tại.");

            if (booking.CustomerId != customerId)
                throw new ValidationException(["Bạn không có quyền hủy booking này."]);

            var now = DateTime.UtcNow;
            var paidDeposit = await _walletService.GetPaidDepositAmountAsync(booking.Id, cancellationToken);
            var quote = _walletService.BuildCancellationQuote(booking, paidDeposit, now);
            if (!quote.CanCancel)
                throw new ValidationException([quote.PolicyMessage]);

            var previousStatus = booking.Status;
            var reason = string.IsNullOrWhiteSpace(request.Reason)
                ? "Khách hàng chủ động hủy booking."
                : request.Reason.Trim();

            await _disputeRepository.ExecuteInTransactionAsync(async ct =>
            {
                await _walletService.ApplyCancellationWalletSettlementAsync(booking, quote, now, ct);

                booking.Status = "Cancelled";
                booking.CancelledBy = customerId;
                booking.CancelReason = reason;
                booking.CancelledAt = now;
                booking.UpdatedAt = now;
                booking.CancellationSource = "Customer";
                if (!quote.HasPaidDeposit)
                    booking.CancellationPolicyTier = "UnpaidFree";
                _repo.Update(booking);

                var trustScore = await _repo.GetTrustScoreByUserIdAsync(customerId, ct);
                if (trustScore is not null)
                    trustScore.CancellationCount += 1;

                await _repo.AddStatusHistoryAsync(new BookingStatusHistory
                {
                    BookingId = booking.Id,
                    FromStatus = previousStatus,
                    ToStatus = "Cancelled",
                    ChangedBy = customerId,
                    Note = $"{reason} {quote.PolicyMessage} Hoàn cọc: {quote.RefundAmount:N0}đ; khấu trừ: {quote.ForfeitedAmount:N0}đ.",
                    CreatedAt = now,
                }, ct);

                await _repo.SaveChangesAsync(ct);
            }, cancellationToken);

            await NotifyUserAsync(
                booking.OwnerId,
                booking,
                "Khách hàng đã hủy booking",
                $"{booking.BookingCode}: Khách đã hủy. Tiền cọc giữ lại: {quote.ForfeitedAmount:N0}đ.",
                "owner",
                $"/owner/bookings/{booking.Id}",
                "BookingCancelledByCustomer",
                cancellationToken);

            await NotifyUserAsync(
                booking.CustomerId,
                booking,
                "Đã hủy booking",
                quote.HasPaidDeposit
                    ? $"{booking.BookingCode}: Số tiền hoàn vào ví là {quote.RefundAmount:N0}đ."
                    : $"{booking.BookingCode}: Booking đã được hủy miễn phí.",
                "customer",
                $"/customer/bookings/{booking.Id}",
                "BookingCancelled",
                cancellationToken);

            return await MapAsync(booking, cancellationToken);
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(lockHandle, cancellationToken);
        }
    }

    public async Task<BookingResponse> CompleteAsync(long bookingId, long customerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(new[] { "Bạn không có quyền xác nhận hoàn tất booking này." });

        if (booking.Status != "DepositPaid" && booking.Status != "Confirmed" && booking.Status != "InProgress")
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

    public async Task<BookingResponse> OwnerCompleteAsync(long bookingId, long ownerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking khong ton tai.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Ban khong co quyen hoan thanh booking nay." });

        if (booking.Status != "DepositPaid" && booking.Status != "InProgress" && booking.Status != "Completed")
            throw new ValidationException(new[] { "Chi co the hoan thanh booking da thanh toan coc, dang trong chuyen hoac da duoc khach xac nhan." });

        if (await _disputeRepository.HasOpenDisputeForBookingAsync(booking.Id, cancellationToken))
            throw new ValidationException(new[] { "Booking đang có tranh chấp. Khoản tiền cọc được giữ đến khi tranh chấp kết thúc." });

        var disputePayout = await _disputeRepository.GetCompletedPlatformSettlementForBookingAsync(booking.Id, cancellationToken);
        var refundedDeposit = await _disputeRepository.GetCompletedDepositRefundForBookingAsync(booking.Id, cancellationToken);
        var checkOut = await _disputeRepository.GetInspectionReportAsync(booking.Id, "CheckOut", cancellationToken);
        if (checkOut is not null
            && DateTime.UtcNow < checkOut.CreatedAt.AddHours(48)
            && disputePayout <= 0m
            && refundedDeposit <= 0m)
        {
            throw new ValidationException(new[] { "Khoản tiền đang được giữ trong 48 giờ sau check-out để khách có thể mở tranh chấp." });
        }
        if (booking.Status != "Completed")
        {
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
                Note = "Chu xe xac nhan hoan thanh chuyen di",
            }, cancellationToken);
        }

        await _disputeRepository.ExecuteInTransactionAsync(async ct =>
        {
            await _walletService.ReleaseCompletedEscrowAsync(booking, disputePayout, refundedDeposit, DateTime.UtcNow, ct);
            await _repo.SaveChangesAsync(ct);
        }, cancellationToken);

        await NotifyUserAsync(
            booking.CustomerId,
            booking,
            "Chuyen di da hoan thanh",
            $"{booking.BookingCode}: Chu xe da xac nhan hoan thanh chuyen di.",
            "customer",
            $"/booking/{booking.Id}",
            "BookingCompleted",
            cancellationToken);

        await NotifyUserAsync(
            booking.OwnerId,
            booking,
            "Hoan thanh booking thanh cong",
            $"{booking.BookingCode}: Ban da xac nhan hoan thanh chuyen di. Tien trong escrow da duoc quyet toan.",
            "owner",
            $"/booking/{booking.Id}",
            "BookingCompleted",
            cancellationToken);

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<InspectionReportResponse> CreateCheckInReportAsync(
        long bookingId,
        long ownerId,
        CreateInspectionReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Ban khong co quyen tao bien ban cho booking nay." });

        if (booking.Status != "DepositPaid" && booking.Status != "Confirmed")
            throw new ValidationException(new[] { "Chỉ có thể check-in booking đã đặt cọc hoặc đã xác nhận." });

        if (await _repo.HasInspectionReportAsync(bookingId, "CheckIn", cancellationToken))
            throw new ValidationException(new[] { "Booking này đã có biên bản check-in." });

        if (request.Images.Count == 0)
            throw new ValidationException(new[] { "Cần tải lên ít nhất 1 ảnh check-in." });

        if (request.Images.Count > 12)
            throw new ValidationException(new[] { "Chỉ được tải tối đa 12 ảnh check-in." });

        var uploadedUrls = new List<string>();
        foreach (var image in request.Images)
        {
            var upload = await _cloudinaryService.UploadAsync(
                image.Content,
                image.FileName,
                $"movevn/bookings/{bookingId}/check-in",
                cancellationToken);
            uploadedUrls.Add(upload.Url);
        }

        var report = new InspectionReport
        {
            BookingId = bookingId,
            Type = "CheckIn",
            StaffId = ownerId,
            OdometerKm = request.OdometerKm,
            FuelLevel = request.FuelLevel,
            DamageNoted = request.DamageNoted,
            DamageDescription = request.DamageDescription,
            CreatedAt = DateTime.UtcNow,
        };

        await _repo.AddInspectionReportAsync(report, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        foreach (var url in uploadedUrls)
        {
            await _repo.AddCheckInOutImageAsync(new CheckInOutImage
            {
                BookingId = bookingId,
                InspectionId = report.Id,
                ImageUrl = url,
                ImageType = "Before",
                UploadedBy = ownerId,
                CreatedAt = DateTime.UtcNow,
            }, cancellationToken);
        }

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = booking.Status,
            ToStatus = booking.Status,
            ChangedBy = ownerId,
            Note = "Owner tao bien ban check-in, cho khach xac nhan nhan xe.",
        }, cancellationToken);

        await _repo.SaveChangesAsync(cancellationToken);

        var images = await _repo.GetCheckInOutImagesAsync(bookingId, cancellationToken);
        return MapInspectionReport(report, images, isCustomerConfirmed: false);
    }

    public async Task<InspectionReportResponse> CreateCheckOutReportAsync(
        long bookingId,
        long ownerId,
        CreateInspectionReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking khong ton tai.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Ban khong co quyen tao bien ban cho booking nay." });

        if (booking.Status != "InProgress")
            throw new ValidationException(new[] { "Chi co the check-out booking dang trong chuyen." });

        if (await _repo.HasInspectionReportAsync(bookingId, "CheckOut", cancellationToken))
            throw new ValidationException(new[] { "Booking nay da co bien ban check-out." });

        if (request.Images.Count == 0)
            throw new ValidationException(new[] { "Can tai len it nhat 1 anh check-out." });

        if (request.Images.Count > 12)
            throw new ValidationException(new[] { "Chi duoc tai toi da 12 anh check-out." });

        var uploadedUrls = new List<string>();
        foreach (var image in request.Images)
        {
            var upload = await _cloudinaryService.UploadAsync(
                image.Content,
                image.FileName,
                $"movevn/bookings/{bookingId}/check-out",
                cancellationToken);
            uploadedUrls.Add(upload.Url);
        }

        var report = new InspectionReport
        {
            BookingId = bookingId,
            Type = "CheckOut",
            StaffId = ownerId,
            OdometerKm = request.OdometerKm,
            FuelLevel = request.FuelLevel,
            DamageNoted = request.DamageNoted,
            DamageDescription = request.DamageDescription,
            CreatedAt = DateTime.UtcNow,
        };

        await _repo.AddInspectionReportAsync(report, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        foreach (var url in uploadedUrls)
        {
            await _repo.AddCheckInOutImageAsync(new CheckInOutImage
            {
                BookingId = bookingId,
                InspectionId = report.Id,
                ImageUrl = url,
                ImageType = "After",
                UploadedBy = ownerId,
                CreatedAt = DateTime.UtcNow,
            }, cancellationToken);
        }

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = booking.Status,
            ToStatus = booking.Status,
            ChangedBy = ownerId,
            Note = "Owner tao bien ban check-out, cho khach xac nhan tra xe.",
        }, cancellationToken);

        await _repo.SaveChangesAsync(cancellationToken);

        var images = await _repo.GetCheckInOutImagesAsync(bookingId, cancellationToken);
        return MapInspectionReport(report, images, isCustomerConfirmed: false);
    }

    public async Task<BookingResponse> ConfirmCheckInAsync(long bookingId, long customerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(new[] { "Bạn không có quyền xác nhận check-in cho booking này." });

        if (booking.Status != "DepositPaid" && booking.Status != "Confirmed")
            throw new ValidationException(new[] { "Booking không ở trạng thái chờ xác nhận check-in." });

        var report = await _repo.GetInspectionReportAsync(bookingId, "CheckIn", cancellationToken);
        if (report is null)
            throw new ValidationException(new[] { "Chưa có biên bản check-in để xác nhận." });

        var oldStatus = booking.Status;
        booking.Status = "InProgress";
        booking.UpdatedAt = DateTime.UtcNow;
        _repo.Update(booking);

        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = oldStatus,
            ToStatus = "InProgress",
            ChangedBy = customerId,
            Note = "Khách hàng xác nhận biên bản check-in và nhận xe.",
        }, cancellationToken);

        await _repo.SaveChangesAsync(cancellationToken);
        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> ConfirmCheckOutAsync(long bookingId, long customerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking khong ton tai.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(new[] { "Ban khong co quyen xac nhan check-out cho booking nay." });

        if (booking.Status != "InProgress")
            throw new ValidationException(new[] { "Booking khong o trang thai cho xac nhan check-out." });

        var report = await _repo.GetInspectionReportAsync(bookingId, "CheckOut", cancellationToken);
        if (report is null)
            throw new ValidationException(new[] { "Chua co bien ban check-out de xac nhan." });

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
            Note = "Khach hang xac nhan bien ban check-out va tra xe.",
        }, cancellationToken);

        await _repo.SaveChangesAsync(cancellationToken);
        return await MapAsync(booking, cancellationToken);
    }

    public async Task<List<InspectionReportResponse>> GetInspectionReportsAsync(
        long bookingId,
        long userId,
        bool isStaffOrAdmin,
        CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (!isStaffOrAdmin && booking.CustomerId != userId && booking.OwnerId != userId)
            throw new ValidationException(new[] { "Bạn không có quyền xem biên bản của booking này." });

        var reports = await _repo.GetInspectionReportsAsync(bookingId, cancellationToken);
        var images = await _repo.GetCheckInOutImagesAsync(bookingId, cancellationToken);

        return reports
            .Select(report =>
            {
                var isCustomerConfirmed = report.Type == "CheckIn"
                    ? booking.Status is "InProgress" or "Completed"
                    : booking.Status == "Completed";
                return MapInspectionReport(report, images, isCustomerConfirmed);
            })
            .ToList();
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

    private static decimal CalculatePlatformFee(decimal totalAmount, string feeType, decimal feeValue, decimal? minFee, decimal? maxFee)
    {
        var fee = feeType.Equals("Fixed", StringComparison.OrdinalIgnoreCase)
            ? feeValue
            : totalAmount * feeValue / 100m;

        if (minFee.HasValue) fee = Math.Max(fee, minFee.Value);
        if (maxFee.HasValue) fee = Math.Min(fee, maxFee.Value);
        return Math.Round(Math.Clamp(fee, 0m, totalAmount), 0);
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
        var ownerReviewStats = await _repo.GetOwnerReviewStatsForCustomerAsync(customerId, cancellationToken);
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
            OwnerReviewCount = ownerReviewStats.OwnerReviewCount,
            OwnerAverageRating = ownerReviewStats.OwnerAverageRating,
            OwnerLowRatingCount = ownerReviewStats.OwnerLowRatingCount,
            OwnerRecentLowRatingCount90Days = ownerReviewStats.OwnerRecentLowRatingCount90Days,
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

    private static InspectionReportResponse MapInspectionReport(
        InspectionReport report,
        IReadOnlyCollection<CheckInOutImage> images,
        bool isCustomerConfirmed)
    {
        return new InspectionReportResponse
        {
            Id = report.Id,
            BookingId = report.BookingId,
            Type = report.Type,
            CreatedByUserId = report.StaffId,
            OdometerKm = report.OdometerKm,
            FuelLevel = report.FuelLevel,
            DamageNoted = report.DamageNoted,
            DamageDescription = report.DamageDescription,
            ReportPdfUrl = report.ReportPdfUrl,
            CustomerSignatureUrl = report.CustomerSignatureUrl,
            IsCustomerConfirmed = isCustomerConfirmed,
            CreatedAt = report.CreatedAt,
            Images = images
                .Where(image => image.InspectionId == report.Id)
                .Select(image => new CheckInOutImageResponse
                {
                    Id = image.Id,
                    BookingId = image.BookingId,
                    InspectionId = image.InspectionId,
                    ImageUrl = image.ImageUrl,
                    ImageType = image.ImageType,
                    UploadedBy = image.UploadedBy,
                    CreatedAt = image.CreatedAt,
                })
                .ToList(),
        };
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
            PlatformFeeType = b.PlatformFeeType,
            PlatformFeeValue = b.PlatformFeeValue,
            DepositAmount = b.DepositAmount,
            TotalAmount = b.TotalAmount,
            EscrowAmount = b.EscrowAmount,
            EscrowStatus = b.EscrowStatus,
            EscrowHeldAt = b.EscrowHeldAt,
            EscrowSettledAt = b.EscrowSettledAt,
            PaymentDueAt = b.PaymentDueAt,
            PickupAddress = b.PickupAddress,
            ReturnAddress = b.ReturnAddress,
            CustomerNote = b.CustomerNote,
            Status = b.Status,
            RiskScore = risk.Score,
            RiskLevel = risk.Level,
            RiskFactors = risk.Factors,
            CancelReason = b.CancelReason,
            CancellationPolicyTier = b.CancellationPolicyTier,
            CancellationRefundAmount = b.CancellationRefundAmount,
            CancellationForfeitedAmount = b.CancellationForfeitedAmount,
            CancellationOwnerCompensation = b.CancellationOwnerCompensation,
            CancellationPlatformFee = b.CancellationPlatformFee,
            SecurityDepositAmount = b.SecurityDepositAmount,
            PromotionId = b.PromotionId,
            PromotionCode = b.PromotionCode,
            PromotionDiscount = b.PromotionDiscount,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt,
            StatusHistory = history,
        };
    }
}
