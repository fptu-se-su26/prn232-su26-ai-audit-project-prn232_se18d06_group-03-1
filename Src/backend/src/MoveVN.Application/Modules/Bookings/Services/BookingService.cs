using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Bookings.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _repo;
    private readonly INotificationService _notifications;
    private readonly IAuditLogService _auditLog;
    private readonly ISystemConfigService _config;

    public BookingService(
        IBookingRepository repo,
        INotificationService notifications,
        IAuditLogService auditLog,
        ISystemConfigService config)
    {
        _repo = repo;
        _notifications = notifications;
        _auditLog = auditLog;
        _config = config;
    }

    public async Task<BookingResponse> CreateAsync(CreateBookingRequest request, long customerId, CancellationToken cancellationToken = default)
    {
        if (request.EndDate <= request.StartDate)
            throw new ValidationException(new[] { "Ngày trả phải sau ngày nhận." });

        // Check overlap – atomic
        var hasOverlap = await _repo.HasOverlapAsync(request.VehicleId, request.StartDate, request.EndDate, cancellationToken);
        if (hasOverlap)
            throw new ValidationException(new[] { "Xe đã được đặt trong khoảng thời gian này." });

        // Compute fees from SystemConfig
        var platformFeeRate = await _config.GetValueAsync("platform_fee_pct", 10m, cancellationToken);
        var depositRate = await _config.GetValueAsync("deposit_rate_pct", 30m, cancellationToken);

        var vehicle = await _repo.GetVehicleAsync(request.VehicleId, cancellationToken)
            ?? throw new NotFoundException("Xe không tồn tại.");

        if (vehicle.Status != "Available")
            throw new ValidationException(new[] { "Xe không có sẵn để đặt." });

        int totalDays = request.EndDate.DayNumber - request.StartDate.DayNumber;
        decimal basePrice = vehicle.PricePerDay * totalDays;
        decimal platformFee = Math.Round(basePrice * platformFeeRate / 100, 0);
        decimal depositAmount = Math.Round(basePrice * depositRate / 100, 0);
        decimal totalAmount = basePrice + platformFee;

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
            PlatformFeeType = "Percentage",
            PlatformFeeValue = platformFeeRate
        };

        await _repo.AddAsync(booking, cancellationToken);

        var history = new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = null,
            ToStatus = "Pending",
            ChangedBy = customerId,
            Note = "Booking tạo mới"
        };
        await _repo.AddStatusHistoryAsync(history, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        // Notify owner
        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = vehicle.OwnerId,
            Type = "NewBooking",
            Title = "Booking mới",
            Body = $"Bạn có booking mới #{booking.BookingCode} từ {request.StartDate:dd/MM} đến {request.EndDate:dd/MM}."
        }));

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> ApproveAsync(long bookingId, long ownerId, ApproveBookingRequest request, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "Bạn không có quyền xử lý booking này." });

        if (booking.Status != "Pending")
            throw new ValidationException(new[] { "Booking không ở trạng thái chờ duyệt." });

        var oldStatus = booking.Status;
        booking.Status = request.Approve ? "Approved" : "OwnerRejected";
        booking.CancelReason = request.Approve ? null : request.Reason;
        booking.UpdatedAt = DateTime.UtcNow;

        _repo.Update(booking);
        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = oldStatus,
            ToStatus = booking.Status,
            ChangedBy = ownerId,
            Note = request.Reason
        }, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        // Notify customer
        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = booking.CustomerId,
            Type = request.Approve ? "BookingApproved" : "BookingRejected",
            Title = request.Approve ? "Booking được chấp nhận" : "Booking bị từ chối",
            Body = request.Approve
                ? $"Booking #{booking.BookingCode} đã được Owner chấp nhận. Vui lòng thanh toán cọc."
                : $"Booking #{booking.BookingCode} bị từ chối. Lý do: {request.Reason}"
        }));

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> GetByIdAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");
        return await MapAsync(booking, cancellationToken);
    }

    public async Task<PagedResult<BookingResponse>> GetMyBookingsAsync(long userId, BookingQueryRequest request, CancellationToken cancellationToken = default)
    {
        return await _repo.GetByCustomerPagedAsync(userId, request, cancellationToken);
    }

    public async Task<PagedResult<BookingResponse>> GetOwnerBookingsAsync(long vehicleId, long ownerId, BookingQueryRequest request, CancellationToken cancellationToken = default)
    {
        return await _repo.GetByVehiclePagedAsync(vehicleId, ownerId, request, cancellationToken);
    }

    public async Task AutoCancelExpiredAsync(CancellationToken cancellationToken = default)
    {
        var hours = await _config.GetValueAsync("auto_cancel_hours", 24, cancellationToken);
        var threshold = DateTime.UtcNow.AddHours(-hours);
        var expired = await _repo.GetExpiredPendingAsync(threshold, cancellationToken);

        foreach (var booking in expired)
        {
            booking.Status = "AutoCancelled";
            booking.CancelReason = "Tự động hủy do hết thời gian chờ duyệt.";
            booking.CancelledAt = DateTime.UtcNow;
            _repo.Update(booking);

            await _repo.AddStatusHistoryAsync(new BookingStatusHistory
            {
                BookingId = booking.Id,
                FromStatus = "Pending",
                ToStatus = "AutoCancelled",
                Note = "Auto-cancel by Hangfire job"
            }, cancellationToken);

            _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
            {
                UserId = booking.CustomerId,
                Type = "BookingAutoCancelled",
                Title = "Booking đã bị hủy tự động",
                Body = $"Booking #{booking.BookingCode} đã bị hủy do hết thời gian chờ Owner duyệt."
            }));

            _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
            {
                UserId = booking.OwnerId,
                Type = "BookingAutoCancelled",
                Title = "Booking đã bị hủy tự động",
                Body = $"Booking #{booking.BookingCode} đã hết hạn chờ duyệt và bị hủy tự động."
            }));

            _ = Task.Run(() => _auditLog.LogAsync(null, "System", "AutoCancelBooking", "Booking", booking.Id,
                "Pending", "AutoCancelled"));
        }

        await _repo.SaveChangesAsync(cancellationToken);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string GenerateCode()
    {
        var now = DateTime.UtcNow;
        return $"BK{now:yyyyMMdd}{Random.Shared.Next(1000, 9999)}";
    }

    private async Task<BookingResponse> MapAsync(Booking b, CancellationToken cancellationToken)
    {
        var history = await _repo.GetStatusHistoryAsync(b.Id, cancellationToken);
        var vehicle = await _repo.GetVehicleAsync(b.VehicleId, cancellationToken);
        var contract = await _repo.GetContractUrlAsync(b.Id, cancellationToken);

        return new BookingResponse
        {
            Id = b.Id,
            BookingCode = b.BookingCode,
            CustomerId = b.CustomerId,
            VehicleId = b.VehicleId,
            VehicleName = vehicle is null ? "" : $"{vehicle.BrandId} {vehicle.Year}",
            OwnerId = b.OwnerId,
            StartDate = b.StartDate,
            EndDate = b.EndDate,
            TotalDays = b.TotalDays,
            BasePrice = b.BasePrice,
            PlatformFee = b.PlatformFee,
            DepositAmount = b.DepositAmount,
            TotalAmount = b.TotalAmount,
            PickupAddress = b.PickupAddress,
            CustomerNote = b.CustomerNote,
            Status = b.Status,
            RiskScore = b.RiskScore,
            CancelReason = b.CancelReason,
            ContractUrl = contract,
            CreatedAt = b.CreatedAt,
            StatusHistory = history
        };
    }
}
