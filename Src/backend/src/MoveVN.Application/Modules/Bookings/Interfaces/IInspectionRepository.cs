using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Bookings.Interfaces;

public interface IInspectionRepository
{
    Task<Booking?> GetBookingAsync(long bookingId, CancellationToken cancellationToken = default);
    void UpdateBooking(Booking booking);
    Task AddAsync(InspectionReport report, CancellationToken cancellationToken = default);
    Task AddImageAsync(CheckInOutImage image, CancellationToken cancellationToken = default);
    Task<InspectionReport?> GetByBookingAndTypeAsync(long bookingId, string type, CancellationToken cancellationToken = default);
    Task<List<string>> GetImagesAsync(long inspectionReportId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
