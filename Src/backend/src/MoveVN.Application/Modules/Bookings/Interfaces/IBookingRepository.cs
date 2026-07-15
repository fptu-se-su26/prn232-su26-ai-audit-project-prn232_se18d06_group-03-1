using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Bookings.Interfaces;


public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(Booking booking, CancellationToken cancellationToken = default);
    void Update(Booking booking);
    Task<bool> HasOverlapAsync(long vehicleId, DateTime startDate, DateTime endDate, long? excludeBookingId = null, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetOverlappingBookingsAsync(long vehicleId, DateTime startDate, DateTime endDate, long? excludeBookingId = null, CancellationToken cancellationToken = default);
    Task<Vehicle?> GetVehicleByIdAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<CustomerProfile?> GetCustomerProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<TrustScore?> GetTrustScoreByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<BookingCustomerReviewStats> GetOwnerReviewStatsForCustomerAsync(long customerId, CancellationToken cancellationToken = default);
    Task<int> CountActiveBookingsByCustomerAsync(long customerId, long? excludeBookingId = null, CancellationToken cancellationToken = default);
    Task<int> CountRecentBookingsByCustomerAsync(long customerId, DateTime since, long? excludeBookingId = null, CancellationToken cancellationToken = default);
    Task<VehicleModelVariant?> GetVariantByIdAsync(int variantId, CancellationToken cancellationToken = default);
    Task<bool> IsLicenseClassCompatibleAsync(string licenseClassCode, int requiredLicenseClassId, CancellationToken cancellationToken = default);
    Task AddStatusHistoryAsync(BookingStatusHistory history, CancellationToken cancellationToken = default);
    Task<List<BookingStatusHistoryDto>> GetStatusHistoryAsync(long bookingId, CancellationToken cancellationToken = default);
    Task AddInspectionReportAsync(InspectionReport report, CancellationToken cancellationToken = default);
    Task AddCheckInOutImageAsync(CheckInOutImage image, CancellationToken cancellationToken = default);
    Task<bool> HasInspectionReportAsync(long bookingId, string type, CancellationToken cancellationToken = default);
    Task<InspectionReport?> GetInspectionReportAsync(long bookingId, string type, CancellationToken cancellationToken = default);
    Task<List<InspectionReport>> GetInspectionReportsAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<List<CheckInOutImage>> GetCheckInOutImagesAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<(List<BookingResponse> Items, int TotalCount)> GetByCustomerPagedAsync(long customerId, BookingListRequest request, CancellationToken cancellationToken = default);
    Task<(List<BookingResponse> Items, int TotalCount)> GetByOwnerPagedAsync(long ownerId, BookingListRequest request, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetExpiredPendingAsync(DateTime threshold, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetExpiredApprovedAsync(DateTime now, CancellationToken cancellationToken = default);
    Task AddReviewAsync(Review review, CancellationToken cancellationToken = default);
    Task<List<Review>> GetReviewsByBookingIdAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<List<Review>> GetReviewsByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<bool> HasReviewAsync(long bookingId, long reviewerId, CancellationToken cancellationToken = default);
    Task<DateOnly?> GetNextAvailableDateAsync(long vehicleId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
