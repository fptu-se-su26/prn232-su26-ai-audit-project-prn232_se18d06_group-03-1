using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.System.DTOs;

namespace MoveVN.Application.Modules.System.Interfaces;

public interface IRiskScoringService
{
    Task<RiskPredictionDto> PredictAndLogAsync(RiskPredictionRequest request, CancellationToken cancellationToken = default);
    Task<RiskPredictionDto?> GetLatestByBookingAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<PagedResult<BookingResponse>> GetHighRiskBookingsAsync(int page, int pageSize, CancellationToken cancellationToken = default);
}
