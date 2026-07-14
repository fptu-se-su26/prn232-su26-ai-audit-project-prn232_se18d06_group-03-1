using MoveVN.Application.Modules.VehiclePricings.DTOs;

namespace MoveVN.Application.Modules.VehiclePricings.Interfaces;

public interface IVehiclePricingService
{
    Task<PricingSuggestionResponse> GetSuggestionAsync(int modelId, int areaId, DateOnly? date = null, decimal? vacantRate = null, CancellationToken cancellationToken = default);
    Task<VehiclePricingResponse> GetByVehicleIdAsync(long vehicleId, long ownerId, CancellationToken cancellationToken = default);
    Task<VehiclePricingResponse> UpdateAsync(long vehicleId, long ownerId, UpdateVehiclePricingRequest request, CancellationToken cancellationToken = default);
}
