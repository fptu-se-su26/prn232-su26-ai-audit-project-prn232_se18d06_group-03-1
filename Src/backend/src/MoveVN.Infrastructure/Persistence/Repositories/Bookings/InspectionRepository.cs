using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Bookings.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Bookings;

public class InspectionRepository : IInspectionRepository
{
    private readonly AppDbContext _context;

    public InspectionRepository(AppDbContext context) => _context = context;

    public async Task<Booking?> GetBookingAsync(long bookingId, CancellationToken ct = default)
        => await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct);

    public void UpdateBooking(Booking booking) => _context.Bookings.Update(booking);

    public async Task AddAsync(InspectionReport report, CancellationToken ct = default)
        => await _context.InspectionReports.AddAsync(report, ct);

    public async Task AddImageAsync(CheckInOutImage image, CancellationToken ct = default)
        => await _context.CheckInOutImages.AddAsync(image, ct);

    public async Task<InspectionReport?> GetByBookingAndTypeAsync(long bookingId, string type, CancellationToken ct = default)
        => await _context.InspectionReports.FirstOrDefaultAsync(i => i.BookingId == bookingId && i.Type == type, ct);

    public async Task<List<string>> GetImagesAsync(long inspectionReportId, CancellationToken ct = default)
        => await _context.CheckInOutImages.Where(i => i.InspectionId == inspectionReportId)
            .Select(i => i.ImageUrl).ToListAsync(ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
