using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.VehiclePricings.Services;

public class PricingCalculatorService : IPricingCalculatorService
{
    private readonly IVehicleCatalogRepository _repository;

    public PricingCalculatorService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PricingSuggestionResponse> GetSuggestionAsync(int modelId, int areaId, CancellationToken cancellationToken = default)
    {
        var modelExists = await _repository.VehicleModels.AnyAsync(x => x.Id == modelId, cancellationToken);
        if (!modelExists)
            throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        var area = await _repository.GetAreaByIdAsync(areaId, cancellationToken)
            ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);

        var region = await _repository.GetPricingRegionByIdAsync(area.PricingRegionId, cancellationToken);
        var pricing = await _repository.VehicleModelPricings
            .Where(x => x.ModelId == modelId && x.PricingRegionId == area.PricingRegionId && x.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        return new PricingSuggestionResponse
        {
            HasSuggestion = pricing is not null,
            ModelId = modelId,
            AreaId = area.Id,
            PricingRegionId = area.PricingRegionId,
            PricingRegionCode = region?.Code,
            BasePrice = pricing?.BasePrice,
            SuggestedMinPrice = pricing?.SuggestedMinPrice,
            SuggestedMaxPrice = pricing?.SuggestedMaxPrice
        };
    }

    public async Task ValidatePricingAsync(Vehicle vehicle, UpdateVehiclePricingRequest request, CancellationToken cancellationToken = default)
    {
        if (request.PricingMode is not (PricingModes.Fixed or PricingModes.Auto))
            throw new AppException(ErrorCode.PRICING_MODE_INVALID);

        if (request.PricingMode == PricingModes.Fixed)
        {
            var fixedPrice = request.FixedPricePerDay ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
            if (fixedPrice <= 0)
                throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
        }
        else
        {
            var autoMinPrice = request.AutoMinPrice ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
            var autoMaxPrice = request.AutoMaxPrice ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
            if (autoMinPrice <= 0 || autoMaxPrice <= 0 || autoMinPrice > autoMaxPrice)
                throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
        }

        if (!vehicle.AreaId.HasValue)
            return;

        var suggestion = await GetSuggestionAsync(vehicle.ModelId, vehicle.AreaId.Value, cancellationToken);
        if (!suggestion.HasSuggestion)
            return;

        var min = suggestion.SuggestedMinPrice!.Value;
        var max = suggestion.SuggestedMaxPrice!.Value;

        if (request.PricingMode == PricingModes.Fixed)
        {
            var price = request.FixedPricePerDay ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
            EnsureWithinRange(price, min, max);
            return;
        }

        var autoMin = request.AutoMinPrice ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
        var autoMax = request.AutoMaxPrice ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
        if (autoMin > autoMax)
            throw new AppException(ErrorCode.PRICING_INVALID_RANGE);

        EnsureWithinRange(autoMin, min, max);
        EnsureWithinRange(autoMax, min, max);
    }

    public async Task<decimal> CalculateCurrentPriceAsync(Vehicle vehicle, UpdateVehiclePricingRequest request, DateOnly date, CancellationToken cancellationToken = default)
    {
        if (request.PricingMode == PricingModes.Fixed)
            return request.FixedPricePerDay ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);

        var min = request.AutoMinPrice ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
        var max = request.AutoMaxPrice ?? throw new AppException(ErrorCode.PRICING_INVALID_RANGE);
        var price = min;

        if (vehicle.AreaId.HasValue)
        {
            var suggestion = await GetSuggestionAsync(vehicle.ModelId, vehicle.AreaId.Value, cancellationToken);
            if (suggestion.BasePrice.HasValue)
                price = suggestion.BasePrice.Value;
        }

        var rules = await _repository.PricingRules
            .Where(x => x.VehicleId == vehicle.Id
                && x.IsActive
                && (!x.StartDate.HasValue || x.StartDate <= date)
                && (!x.EndDate.HasValue || x.EndDate >= date))
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);

        foreach (var rule in rules)
        {
            price = rule.RuleType switch
            {
                PricingRuleTypes.Multiplier when rule.Multiplier.HasValue => price * rule.Multiplier.Value,
                PricingRuleTypes.FixedPrice when rule.FixedPrice.HasValue => rule.FixedPrice.Value,
                _ => price
            };
        }

        return Math.Round(Math.Min(Math.Max(price, min), max), 2);
    }

    private static void EnsureWithinRange(decimal price, decimal min, decimal max)
    {
        if (price < min || price > max)
            throw new AppException(ErrorCode.PRICING_OUT_OF_SUGGESTED_RANGE);
    }
}
