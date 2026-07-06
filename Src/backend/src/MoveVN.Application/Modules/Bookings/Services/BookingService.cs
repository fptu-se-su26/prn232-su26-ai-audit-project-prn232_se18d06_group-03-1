using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Bookings.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _repo;
    private readonly IEmailSender _emailSender;
    private readonly IUserRepository _userRepo;

    private static readonly (int MinDays, int MaxDays, decimal DiscountPercent)[] RentalDiscountTiers =
    {
        (3, 3, 5m),
        (5, 6, 10m),
        (7, 29, 15m),
        (30, int.MaxValue, 25m),
    };

    public BookingService(IBookingRepository repo, IEmailSender emailSender, IUserRepository userRepo)
    {
        _repo = repo;
        _emailSender = emailSender;
        _userRepo = userRepo;
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

        var hasOverlap = await _repo.HasOverlapAsync(request.VehicleId, request.StartDate, request.EndDate, null, cancellationToken);
        if (hasOverlap)
            throw new ValidationException(new[] { "Xe đã được đặt trong khoảng thời gian này." });

        var totalDays = Math.Max(1, (int)Math.Ceiling((request.EndDate - request.StartDate).TotalDays));
        if (totalDays <= 0)
            throw new ValidationException(new[] { "Thời gian thuê phải ít nhất 1 ngày." });

        var basePrice = vehicle.PricePerDay * totalDays;
        var discountPercent = GetDiscountPercent(totalDays);
        var discountAmount = Math.Round(basePrice * discountPercent / 100, 0);
        var afterDiscount = basePrice - discountAmount;
        var platformFee = Math.Round(afterDiscount * 10 / 100, 0);
        var depositAmount = vehicle.RequiresDeposit
            ? Math.Round(afterDiscount * 20 / 100, 0)
            : 0;
        var totalAmount = afterDiscount + platformFee;

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
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
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

        return await MapAsync(booking, cancellationToken);
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
            throw new ValidationException(new[] { "Booking không ở trạng thái chờ duyệt." });

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
        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> ConfirmDepositAsync(long bookingId, long customerId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.CustomerId != customerId)
            throw new ValidationException(new[] { "Bạn không có quyền xác nhận cọc cho booking này." });

        if (booking.Status != "Approved")
            throw new ValidationException(new[] { "Booking chưa được duyệt hoặc đã xác nhận cọc." });

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

        await _repo.SaveChangesAsync(cancellationToken);
        return await MapAsync(booking, cancellationToken);
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

    private async Task<BookingResponse> MapAsync(Booking b, CancellationToken cancellationToken)
    {
        var history = await _repo.GetStatusHistoryAsync(b.Id, cancellationToken);
        var vehicle = await _repo.GetVehicleByIdAsync(b.VehicleId, cancellationToken);

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
            CancelReason = b.CancelReason,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt,
            StatusHistory = history,
        };
    }
}
