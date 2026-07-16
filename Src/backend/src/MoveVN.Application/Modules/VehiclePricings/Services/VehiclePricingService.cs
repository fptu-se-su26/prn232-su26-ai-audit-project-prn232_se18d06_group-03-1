using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.VehiclePricings.Services;

public class VehiclePricingService : IVehiclePricingService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IPricingCalculatorService _calculator;

    public VehiclePricingService(IVehicleCatalogRepository repository, IPricingCalculatorService calculator)
    {
        _repository = repository;
        _calculator = calculator;
    }

    public Task<PricingSuggestionResponse> GetSuggestionAsync(int modelId, int areaId, DateOnly? date = null, decimal? vacantRate = null, CancellationToken cancellationToken = default)
        => _calculator.GetSuggestionAsync(modelId, areaId, date, vacantRate, cancellationToken);

    public async Task<VehiclePricingResponse> GetByVehicleIdAsync(long vehicleId, long ownerId, CancellationToken cancellationToken = default)
    {
        var vehicle = await GetOwnedVehicleAsync(vehicleId, ownerId, cancellationToken);
        var pricing = await _repository.GetVehiclePricingByVehicleIdAsync(vehicle.Id, cancellationToken);

        if (pricing is null)
        {
            pricing = new VehiclePricing
            {
                VehicleId = vehicle.Id,
                PricingMode = PricingModes.Fixed,
                FixedPricePerDay = vehicle.PricePerDay,
                CurrentPricePerDay = vehicle.PricePerDay,
                LastUpdatedAt = DateTime.UtcNow
            };
            _repository.Add(pricing);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        return await ToResponseAsync(vehicle, pricing, cancellationToken);
    }

    public async Task<VehiclePricingResponse> UpdateAsync(long vehicleId, long ownerId, UpdateVehiclePricingRequest request, CancellationToken cancellationToken = default)
    {
        var vehicle = await GetOwnedVehicleAsync(vehicleId, ownerId, cancellationToken);
        await _calculator.ValidatePricingAsync(vehicle, request, cancellationToken);

        var pricing = await _repository.GetVehiclePricingByVehicleIdAsync(vehicle.Id, cancellationToken);
        if (pricing is null)
        {
            pricing = new VehiclePricing { VehicleId = vehicle.Id };
            _repository.Add(pricing);
        }

        var currentPrice = await _calculator.CalculateCurrentPriceAsync(vehicle, request, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);

        pricing.PricingMode = request.PricingMode;
        pricing.FixedPricePerDay = request.PricingMode == PricingModes.Fixed ? request.FixedPricePerDay : null;
        pricing.AutoMinPrice = request.PricingMode == PricingModes.Auto ? request.AutoMinPrice : null;
        pricing.AutoMaxPrice = request.PricingMode == PricingModes.Auto ? request.AutoMaxPrice : null;
        pricing.CurrentPricePerDay = currentPrice;
        pricing.LastCalculatedAt = request.PricingMode == PricingModes.Auto ? DateTime.UtcNow : null;
        pricing.LastUpdatedAt = DateTime.UtcNow;
        vehicle.PricePerDay = currentPrice;

        await _repository.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(vehicle, pricing, cancellationToken);
    }

    private async Task<Vehicle> GetOwnedVehicleAsync(long vehicleId, long ownerId, CancellationToken cancellationToken)
    {
        return await _repository.GetVehicleByIdAndOwnerIdAsync(vehicleId, ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);
    }

    private async Task<VehiclePricingResponse> ToResponseAsync(Vehicle vehicle, VehiclePricing pricing, CancellationToken cancellationToken)
    {
        PricingSuggestionResponse? suggestion = null;
        if (vehicle.AreaId.HasValue)
            suggestion = await _calculator.GetSuggestionAsync(vehicle.ModelId, vehicle.AreaId.Value, cancellationToken: cancellationToken);

        return new VehiclePricingResponse
        {
            VehicleId = vehicle.Id,
            PricingMode = pricing.PricingMode,
            FixedPricePerDay = pricing.FixedPricePerDay,
            AutoMinPrice = pricing.AutoMinPrice,
            AutoMaxPrice = pricing.AutoMaxPrice,
            CurrentPricePerDay = pricing.CurrentPricePerDay,
            LastCalculatedAt = pricing.LastCalculatedAt,
            LastUpdatedAt = pricing.LastUpdatedAt,
            Suggestion = suggestion
        };
    }
}
