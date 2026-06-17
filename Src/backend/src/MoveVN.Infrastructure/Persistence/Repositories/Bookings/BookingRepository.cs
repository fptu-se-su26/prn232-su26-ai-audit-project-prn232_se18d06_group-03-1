using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Bookings;

public class BookingRepository : IBookingRepository
{
    private readonly AppDbContext _context;

    public BookingRepository(AppDbContext context) => _context = context;

    public async Task<Booking?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _context.Bookings.FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task AddAsync(Booking booking, CancellationToken ct = default)
        => await _context.Bookings.AddAsync(booking, ct);

    public void Update(Booking booking) => _context.Bookings.Update(booking);

    public async Task<bool> HasOverlapAsync(long vehicleId, DateOnly startDate, DateOnly endDate, CancellationToken ct = default)
        => await _context.Bookings.AnyAsync(b => b.VehicleId == vehicleId && b.Status != "Cancelled" && b.Status != "Rejected" && b.StartDate < endDate && b.EndDate > startDate, ct);

    public async Task<Vehicle?> GetVehicleAsync(long vehicleId, CancellationToken ct = default)
        => await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId, ct);

    public async Task AddStatusHistoryAsync(BookingStatusHistory history, CancellationToken ct = default)
        => await _context.BookingStatusHistories.AddAsync(history, ct);

    public async Task<List<BookingStatusHistoryDto>> GetStatusHistoryAsync(long bookingId, CancellationToken ct = default)
        => await _context.BookingStatusHistories.Where(h => h.BookingId == bookingId)
            .Select(h => new BookingStatusHistoryDto { FromStatus = h.FromStatus, ToStatus = h.ToStatus, Note = h.Note, CreatedAt = h.CreatedAt })
            .ToListAsync(ct);

    public async Task<string?> GetContractUrlAsync(long bookingId, CancellationToken ct = default)
        => await _context.Contracts.Where(c => c.BookingId == bookingId).Select(c => c.PdfUrl).FirstOrDefaultAsync(ct);

    public async Task<PagedResult<BookingResponse>> GetByCustomerPagedAsync(long customerId, BookingQueryRequest request, CancellationToken ct = default)
    {
        var query = _context.Bookings.Where(b => b.CustomerId == customerId).OrderByDescending(b => b.CreatedAt).AsQueryable();
        var total = await query.CountAsync(ct);
        var items = await query.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
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
                CustomerNote = b.CustomerNote,
                Status = b.Status,
                RiskScore = b.RiskScore,
                CancelReason = b.CancelReason,
                CreatedAt = b.CreatedAt
            }).ToListAsync(ct);
        return PagedResult<BookingResponse>.Create(items, total, request.Page, request.PageSize);
    }

    public async Task<PagedResult<BookingResponse>> GetByVehiclePagedAsync(long vehicleId, long ownerId, BookingQueryRequest request, CancellationToken ct = default)
    {
        var query = _context.Bookings
            .Where(b => b.VehicleId == vehicleId && b.OwnerId == ownerId)
            .OrderByDescending(b => b.CreatedAt)
            .AsQueryable();
        var total = await query.CountAsync(ct);
        var items = await query.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
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
                CustomerNote = b.CustomerNote,
                Status = b.Status,
                RiskScore = b.RiskScore,
                CancelReason = b.CancelReason,
                CreatedAt = b.CreatedAt
            }).ToListAsync(ct);
        return PagedResult<BookingResponse>.Create(items, total, request.Page, request.PageSize);
    }

    public async Task<List<Booking>> GetExpiredPendingAsync(DateTime threshold, CancellationToken ct = default)
        => await _context.Bookings.Where(b => b.Status == "Pending" && b.CreatedAt < threshold).ToListAsync(ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
