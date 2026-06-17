using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Bookings.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _repo;
    private readonly INotificationService _notifications;
    private readonly IAuditLogService _auditLog;
    private readonly ISystemConfigService _config;
    private readonly ITrustScoreService _trustScoreService;
    private readonly IRiskScoringService _riskScoringService;

    public BookingService(
        IBookingRepository repo,
        INotificationService notifications,
        IAuditLogService auditLog,
        ISystemConfigService config,
        ITrustScoreService trustScoreService,
        IRiskScoringService riskScoringService)
    {
        _repo = repo;
        _notifications = notifications;
        _auditLog = auditLog;
        _config = config;
        _trustScoreService = trustScoreService;
        _riskScoringService = riskScoringService;
    }

    public async Task<BookingResponse> CreateAsync(CreateBookingRequest request, long customerId, CancellationToken cancellationToken = default)
    {
        if (request.EndDate <= request.StartDate)
            throw new ValidationException(new[] { "Return date must be after pickup date." });

        var hasOverlap = await _repo.HasOverlapAsync(request.VehicleId, request.StartDate, request.EndDate, cancellationToken);
        if (hasOverlap)
            throw new ValidationException(new[] { "Vehicle is already booked in this time range." });

        var platformFeeRate = await _config.GetValueAsync("platform_fee_pct", 10m, cancellationToken);
        var defaultDepositRate = await _config.GetValueAsync("deposit_rate_pct", 30m, cancellationToken);

        var vehicle = await _repo.GetVehicleAsync(request.VehicleId, cancellationToken)
            ?? throw new NotFoundException("Vehicle not found.");

        if (vehicle.Status != "Available")
            throw new ValidationException(new[] { "Vehicle is not available for booking." });

        var trustScore = await _trustScoreService.GetByUserAsync(customerId, cancellationToken);
        var depositRate = (trustScore?.Score ?? 0) >= 80 ? 20m : defaultDepositRate;

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
        await _repo.AddStatusHistoryAsync(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = null,
            ToStatus = "Pending",
            ChangedBy = customerId,
            Note = "Booking created"
        }, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        await _riskScoringService.PredictAndLogAsync(new RiskPredictionRequest
        {
            BookingId = booking.Id,
            UserId = customerId,
            TrustScore = trustScore?.Score,
            CancelCount = trustScore?.CancellationCount ?? 0,
            DurationDays = totalDays,
            VehicleValue = basePrice
        }, cancellationToken);

        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = vehicle.OwnerId,
            Type = "NewBooking",
            Title = "New booking received",
            Body = $"Booking #{booking.BookingCode} is waiting for your approval."
        }));

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> ApproveAsync(long bookingId, long ownerId, ApproveBookingRequest request, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.OwnerId != ownerId)
            throw new ValidationException(new[] { "You do not have permission to approve this booking." });

        if (booking.Status != "Pending")
            throw new ValidationException(new[] { "Booking is not pending approval." });

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

        _ = Task.Run(() => _notifications.SendAsync(new CreateNotificationRequest
        {
            UserId = booking.CustomerId,
            Type = request.Approve ? "BookingApproved" : "BookingRejected",
            Title = request.Approve ? "Booking approved" : "Booking rejected",
            Body = request.Approve
                ? $"Booking #{booking.BookingCode} was approved. Please pay the deposit."
                : $"Booking #{booking.BookingCode} was rejected. Reason: {request.Reason}"
        }));

        return await MapAsync(booking, cancellationToken);
    }

    public async Task<BookingResponse> GetByIdAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        var booking = await _repo.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking not found.");
        return await MapAsync(booking, cancellationToken);
    }

    public Task<PagedResult<BookingResponse>> GetMyBookingsAsync(long userId, BookingQueryRequest request, CancellationToken cancellationToken = default)
        => _repo.GetByCustomerPagedAsync(userId, request, cancellationToken);

    public Task<PagedResult<BookingResponse>> GetOwnerBookingsAsync(long vehicleId, long ownerId, BookingQueryRequest request, CancellationToken cancellationToken = default)
        => _repo.GetByVehiclePagedAsync(vehicleId, ownerId, request, cancellationToken);

    public async Task AutoCancelExpiredAsync(CancellationToken cancellationToken = default)
    {
        var hours = await _config.GetValueAsync("auto_cancel_hours", 24, cancellationToken);
        var threshold = DateTime.UtcNow.AddHours(-hours);
        var expired = await _repo.GetExpiredPendingAsync(threshold, cancellationToken);

        foreach (var booking in expired)
        {
            booking.Status = "AutoCancelled";
            booking.CancelReason = "Automatically cancelled after approval timeout.";
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
                Title = "Booking auto-cancelled",
                Body = $"Booking #{booking.BookingCode} expired while waiting for owner approval."
            }));

            _ = Task.Run(() => _auditLog.LogAsync(null, "System", "AutoCancelBooking", "Booking", booking.Id, "Pending", "AutoCancelled"));
        }

        await _repo.SaveChangesAsync(cancellationToken);
    }

    private static string GenerateCode()
    {
        var now = DateTime.UtcNow;
        return $"BK{now:yyyyMMdd}{Random.Shared.Next(1000, 9999)}";
    }

    private async Task<BookingResponse> MapAsync(Booking booking, CancellationToken cancellationToken)
    {
        var history = await _repo.GetStatusHistoryAsync(booking.Id, cancellationToken);
        var vehicle = await _repo.GetVehicleAsync(booking.VehicleId, cancellationToken);
        var contract = await _repo.GetContractUrlAsync(booking.Id, cancellationToken);

        return new BookingResponse
        {
            Id = booking.Id,
            BookingCode = booking.BookingCode,
            CustomerId = booking.CustomerId,
            VehicleId = booking.VehicleId,
            VehicleName = vehicle is null ? string.Empty : $"{vehicle.BrandId} {vehicle.Year}",
            OwnerId = booking.OwnerId,
            StartDate = booking.StartDate,
            EndDate = booking.EndDate,
            TotalDays = booking.TotalDays,
            BasePrice = booking.BasePrice,
            PlatformFee = booking.PlatformFee,
            DepositAmount = booking.DepositAmount,
            TotalAmount = booking.TotalAmount,
            PickupAddress = booking.PickupAddress,
            CustomerNote = booking.CustomerNote,
            Status = booking.Status,
            RiskScore = booking.RiskScore,
            CancelReason = booking.CancelReason,
            ContractUrl = contract,
            CreatedAt = booking.CreatedAt,
            StatusHistory = history
        };
    }
}
