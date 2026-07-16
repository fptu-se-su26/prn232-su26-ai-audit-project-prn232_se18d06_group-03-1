using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Bookings;

public class BookingRepository : IBookingRepository
{
    private readonly AppDbContext _context;

    public BookingRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Booking?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
        => await _context.Bookings.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public async Task AddAsync(Booking booking, CancellationToken cancellationToken = default)
        => await _context.Bookings.AddAsync(booking, cancellationToken);

    public void Update(Booking booking)
        => _context.Bookings.Update(booking);

    public async Task<bool> HasOverlapAsync(long vehicleId, DateTime startDate, DateTime endDate, long? excludeBookingId = null, CancellationToken cancellationToken = default)
    {
        var bookingOverlap = await _context.Bookings
            .AnyAsync(b => b.VehicleId == vehicleId
                && (b.Status == "Approved"
                    || b.Status == "DepositPaid"
                    || b.Status == "Confirmed"
                    || b.Status == "InProgress")
                && b.StartDate < endDate
                && b.EndDate > startDate
                && (!excludeBookingId.HasValue || b.Id != excludeBookingId.Value), cancellationToken);

        if (bookingOverlap) return true;

        var bookingStartDateOnly = DateOnly.FromDateTime(startDate);
        var bookingEndDateOnly = DateOnly.FromDateTime(endDate);

        return await _context.BlockedDates
            .AnyAsync(bd => bd.VehicleId == vehicleId
                && bd.StartDate <= bookingEndDateOnly
                && bd.EndDate >= bookingStartDateOnly, cancellationToken);
    }

    public async Task<List<Booking>> GetOverlappingBookingsAsync(long vehicleId, DateTime startDate, DateTime endDate, long? excludeBookingId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .Where(b => b.VehicleId == vehicleId
                && (b.Status == "Pending" || b.Status == "Approved")
                && b.StartDate < endDate
                && b.EndDate > startDate);

        if (excludeBookingId.HasValue)
            query = query.Where(b => b.Id != excludeBookingId.Value);

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Vehicle?> GetVehicleByIdAsync(long vehicleId, CancellationToken cancellationToken = default)
        => await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);

    public async Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        => await _context.CustomerProfiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

    public async Task<TrustScore?> GetTrustScoreByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        => await _context.TrustScores.FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

    public async Task<BookingCustomerReviewStats> GetOwnerReviewStatsForCustomerAsync(long customerId, CancellationToken cancellationToken = default)
    {
        var recentThreshold = DateTime.UtcNow.AddDays(-90);
        var reviews = await (
                from review in _context.Reviews
                join booking in _context.Bookings on review.BookingId equals booking.Id
                where booking.CustomerId == customerId
                    && booking.OwnerId == review.ReviewerId
                    && review.RevieweeId == customerId
                select new
                {
                    review.Rating,
                    review.CreatedAt
                })
            .ToListAsync(cancellationToken);

        return new BookingCustomerReviewStats
        {
            OwnerReviewCount = reviews.Count,
            OwnerAverageRating = reviews.Count == 0 ? null : reviews.Average(review => (decimal)review.Rating),
            OwnerLowRatingCount = reviews.Count(review => review.Rating <= 2),
            OwnerRecentLowRatingCount90Days = reviews.Count(review => review.Rating <= 2 && review.CreatedAt >= recentThreshold),
        };
    }

    public async Task<int> CountActiveBookingsByCustomerAsync(long customerId, long? excludeBookingId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .Where(b => b.CustomerId == customerId
                && b.Status != "Rejected"
                && b.Status != "Cancelled"
                && b.Status != "Completed");

        if (excludeBookingId.HasValue)
            query = query.Where(b => b.Id != excludeBookingId.Value);

        return await query.CountAsync(cancellationToken);
    }

    public async Task<int> CountRecentBookingsByCustomerAsync(long customerId, DateTime since, long? excludeBookingId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .Where(b => b.CustomerId == customerId
                && b.CreatedAt >= since
                && b.Status != "Rejected"
                && b.Status != "Cancelled"
                && b.Status != "Completed");

        if (excludeBookingId.HasValue)
            query = query.Where(b => b.Id != excludeBookingId.Value);

        return await query.CountAsync(cancellationToken);
    }

    public async Task<VehicleModelVariant?> GetVariantByIdAsync(int variantId, CancellationToken cancellationToken = default)
        => await _context.VehicleModelVariant.FirstOrDefaultAsync(v => v.Id == variantId, cancellationToken);

    public async Task<bool> IsLicenseClassCompatibleAsync(string licenseClassCode, int requiredLicenseClassId, CancellationToken cancellationToken = default)
    {
        var licenseClass = await _context.DriverLicenseClasses
            .FirstOrDefaultAsync(lc => lc.Code == licenseClassCode, cancellationToken);

        if (licenseClass is null)
            return false;

        return await _context.DriverLicenseClassCompatibility
            .AnyAsync(c => c.LicenseClassId == licenseClass.Id && c.AllowedRequiredLicenseClassId == requiredLicenseClassId, cancellationToken);
    }

    public async Task AddStatusHistoryAsync(BookingStatusHistory history, CancellationToken cancellationToken = default)
        => await _context.BookingStatusHistory.AddAsync(history, cancellationToken);

    public async Task<List<BookingStatusHistoryDto>> GetStatusHistoryAsync(long bookingId, CancellationToken cancellationToken = default)
        => await _context.BookingStatusHistory
            .Where(h => h.BookingId == bookingId)
            .OrderBy(h => h.CreatedAt)
            .Select(h => new BookingStatusHistoryDto
            {
                FromStatus = h.FromStatus,
                ToStatus = h.ToStatus,
                ChangedBy = h.ChangedBy,
                Note = h.Note,
                CreatedAt = h.CreatedAt,
            })
            .ToListAsync(cancellationToken);

    public async Task AddInspectionReportAsync(InspectionReport report, CancellationToken cancellationToken = default)
        => await _context.InspectionReports.AddAsync(report, cancellationToken);

    public async Task AddCheckInOutImageAsync(CheckInOutImage image, CancellationToken cancellationToken = default)
        => await _context.CheckInOutImages.AddAsync(image, cancellationToken);

    public async Task<bool> HasInspectionReportAsync(long bookingId, string type, CancellationToken cancellationToken = default)
        => await _context.InspectionReports.AnyAsync(report => report.BookingId == bookingId && report.Type == type, cancellationToken);

    public async Task<InspectionReport?> GetInspectionReportAsync(long bookingId, string type, CancellationToken cancellationToken = default)
        => await _context.InspectionReports
            .Where(report => report.BookingId == bookingId && report.Type == type)
            .OrderByDescending(report => report.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<List<InspectionReport>> GetInspectionReportsAsync(long bookingId, CancellationToken cancellationToken = default)
        => await _context.InspectionReports
            .Where(report => report.BookingId == bookingId)
            .OrderByDescending(report => report.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<List<CheckInOutImage>> GetCheckInOutImagesAsync(long bookingId, CancellationToken cancellationToken = default)
        => await _context.CheckInOutImages
            .Where(image => image.BookingId == bookingId)
            .OrderBy(image => image.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<(List<BookingResponse> Items, int TotalCount)> GetByCustomerPagedAsync(long customerId, BookingListRequest request, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings.Where(b => b.CustomerId == customerId);

        query = ApplyListFilters(query, request);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                BookingCode = b.BookingCode,
                CustomerId = b.CustomerId,
                VehicleId = b.VehicleId,
                OwnerId = b.OwnerId,
                StartDate = b.StartDate,
                EndDate = b.EndDate,
                TotalDays = b.TotalDays,
                BasePrice = b.BasePrice,
                PlatformFee = b.PlatformFee,
                DepositAmount = b.DepositAmount,
                TotalAmount = b.TotalAmount,
                EscrowAmount = b.EscrowAmount,
                EscrowStatus = b.EscrowStatus,
                PaymentDueAt = b.PaymentDueAt,
                PickupAddress = b.PickupAddress,
                Status = b.Status,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
            })
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(List<BookingResponse> Items, int TotalCount)> GetByOwnerPagedAsync(long ownerId, BookingListRequest request, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings.Where(b => b.OwnerId == ownerId);

        query = ApplyListFilters(query, request);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                BookingCode = b.BookingCode,
                CustomerId = b.CustomerId,
                VehicleId = b.VehicleId,
                OwnerId = b.OwnerId,
                StartDate = b.StartDate,
                EndDate = b.EndDate,
                TotalDays = b.TotalDays,
                BasePrice = b.BasePrice,
                PlatformFee = b.PlatformFee,
                DepositAmount = b.DepositAmount,
                TotalAmount = b.TotalAmount,
                EscrowAmount = b.EscrowAmount,
                EscrowStatus = b.EscrowStatus,
                PaymentDueAt = b.PaymentDueAt,
                PickupAddress = b.PickupAddress,
                RiskScore = b.RiskScore,
                Status = b.Status,
                CustomerNote = b.CustomerNote,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
            })
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    private static IQueryable<Booking> ApplyListFilters(IQueryable<Booking> query, BookingListRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(b => b.Status == request.Status);

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim().ToLower();
            if (long.TryParse(keyword, out var numericKeyword))
            {
                query = query.Where(b =>
                    b.BookingCode.ToLower().Contains(keyword) ||
                    b.PickupAddress.ToLower().Contains(keyword) ||
                    b.CustomerId == numericKeyword ||
                    b.VehicleId == numericKeyword);
            }
            else
            {
                query = query.Where(b =>
                    b.BookingCode.ToLower().Contains(keyword) ||
                    b.PickupAddress.ToLower().Contains(keyword));
            }
        }

        if (request.FromDate.HasValue)
        {
            var fromDate = request.FromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(b => b.EndDate >= fromDate);
        }

        if (request.ToDate.HasValue)
        {
            var exclusiveEnd = request.ToDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(b => b.StartDate < exclusiveEnd);
        }

        return query;
    }

    public async Task<List<Booking>> GetExpiredPendingAsync(DateTime threshold, CancellationToken cancellationToken = default)
        => await _context.Bookings
            .Where(b => b.Status == "Pending" && b.CreatedAt < threshold)
            .ToListAsync(cancellationToken);

    public async Task<List<Booking>> GetExpiredApprovedAsync(DateTime now, CancellationToken cancellationToken = default)
        => await _context.Bookings
            .Where(b => b.Status == "Approved"
                && ((b.PaymentDueAt.HasValue && b.PaymentDueAt <= now) || b.StartDate <= now))
            .OrderBy(b => b.PaymentDueAt)
            .ToListAsync(cancellationToken);

    public async Task AddReviewAsync(Review review, CancellationToken cancellationToken = default)
        => await _context.Reviews.AddAsync(review, cancellationToken);

    public async Task<List<Review>> GetReviewsByBookingIdAsync(long bookingId, CancellationToken cancellationToken = default)
        => await _context.Reviews
            .Where(r => r.BookingId == bookingId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<List<Review>> GetReviewsByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default)
        => await _context.Reviews
            .Where(r => r.VehicleId == vehicleId && r.IsPublic)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<bool> HasReviewAsync(long bookingId, long reviewerId, CancellationToken cancellationToken = default)
        => await _context.Reviews.AnyAsync(r => r.BookingId == bookingId && r.ReviewerId == reviewerId, cancellationToken);

    public async Task<DateOnly?> GetNextAvailableDateAsync(long vehicleId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        var startOnly = DateOnly.FromDateTime(startDate);
        var endOnly = DateOnly.FromDateTime(endDate);

        var blockedEnd = await _context.BlockedDates
            .Where(bd => bd.VehicleId == vehicleId && bd.StartDate <= endOnly && bd.EndDate >= startOnly)
            .OrderByDescending(bd => bd.EndDate)
            .Select(bd => (DateOnly?)bd.EndDate)
            .FirstOrDefaultAsync(cancellationToken);

        var bookingEnd = await _context.Bookings
            .Where(b => b.VehicleId == vehicleId
                && b.StartDate < endDate && b.EndDate > startDate
                && b.Status != "Cancelled" && b.Status != "Rejected")
            .OrderByDescending(b => b.EndDate)
            .Select(b => (DateOnly?)DateOnly.FromDateTime(b.EndDate))
            .FirstOrDefaultAsync(cancellationToken);

        var latestEnd = blockedEnd.HasValue && bookingEnd.HasValue
            ? (blockedEnd.Value > bookingEnd.Value ? blockedEnd.Value : bookingEnd.Value)
            : blockedEnd ?? bookingEnd;

        return latestEnd?.AddDays(1);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);
}
