using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.VehiclePricings.Interfaces;

public interface IPricingCalculatorService
{
    Task<PricingSuggestionResponse> GetSuggestionAsync(int modelId, int areaId, DateOnly? date = null, decimal? vacantRate = null, CancellationToken cancellationToken = default);
    Task ValidatePricingAsync(Vehicle vehicle, UpdateVehiclePricingRequest request, CancellationToken cancellationToken = default);
    Task<decimal> CalculateCurrentPriceAsync(Vehicle vehicle, UpdateVehiclePricingRequest request, DateOnly date, CancellationToken cancellationToken = default);
}
