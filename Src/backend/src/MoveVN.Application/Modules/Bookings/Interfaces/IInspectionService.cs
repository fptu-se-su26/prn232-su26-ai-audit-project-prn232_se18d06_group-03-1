using MoveVN.Application.Modules.Bookings.DTOs;

namespace MoveVN.Application.Modules.Bookings.Interfaces;

public interface IInspectionService
{
    Task<InspectionResponse> CreateAsync(CreateInspectionRequest request, long staffId, IList<Microsoft.AspNetCore.Http.IFormFile>? images, CancellationToken cancellationToken = default);
    Task<InspectionResponse?> GetByBookingAndTypeAsync(long bookingId, string type, CancellationToken cancellationToken = default);
}
