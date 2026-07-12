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
        var query = _context.Bookings
            .Where(b => b.VehicleId == vehicleId
                && b.Status != "Rejected"
                && b.Status != "Cancelled"
                && b.StartDate < endDate
                && b.EndDate > startDate);

        if (excludeBookingId.HasValue)
            query = query.Where(b => b.Id != excludeBookingId.Value);

        return await query.AnyAsync(cancellationToken);
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
            .Where(b => b.CustomerId == customerId && b.CreatedAt >= since);

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

    public async Task<(List<BookingResponse> Items, int TotalCount)> GetByCustomerPagedAsync(long customerId, BookingListRequest request, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings.Where(b => b.CustomerId == customerId);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(b => b.Status == request.Status);

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

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(b => b.Status == request.Status);

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

    public async Task<List<Booking>> GetExpiredPendingAsync(DateTime threshold, CancellationToken cancellationToken = default)
        => await _context.Bookings
            .Where(b => b.Status == "Pending" && b.CreatedAt < threshold)
            .ToListAsync(cancellationToken);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);
}
