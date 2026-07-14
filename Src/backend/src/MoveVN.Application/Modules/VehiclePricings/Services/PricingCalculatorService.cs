using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;
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
    private readonly IDynamicPricingSuggestionClient _dynamicPricingClient;
    private readonly ILogger<PricingCalculatorService> _logger;

    public PricingCalculatorService(
        IVehicleCatalogRepository repository,
        IDynamicPricingSuggestionClient dynamicPricingClient,
        ILogger<PricingCalculatorService> logger)
    {
        _repository = repository;
        _dynamicPricingClient = dynamicPricingClient;
        _logger = logger;
    }

    public async Task<PricingSuggestionResponse> GetSuggestionAsync(int modelId, int areaId, DateOnly? date = null, decimal? vacantRate = null, CancellationToken cancellationToken = default)
    {
        if (vacantRate is < 0 or > 1)
            throw new AppException(ErrorCode.PRICING_INVALID_RANGE);

        var model = await _repository.GetVehicleModelByIdAsync(modelId, cancellationToken);
        if (model is null)
            throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        var area = await _repository.GetAreaByIdAsync(areaId, cancellationToken)
            ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);

        var region = await _repository.GetPricingRegionByIdAsync(area.PricingRegionId, cancellationToken);
        var pricing = await _repository.GetActiveVehicleModelPricingByModelIdAsync(modelId, cancellationToken);

        if (pricing is null || region is null)
        {
            return new PricingSuggestionResponse
            {
                HasSuggestion = false,
                ModelId = modelId,
                AreaId = area.Id,
                PricingRegionId = area.PricingRegionId,
                PricingRegionCode = region?.Code
            };
        }

        var basePrice = Math.Round(pricing.BasePrice * region.Coefficient, 2);
        var suggestion = new PricingSuggestionResponse
        {
            HasSuggestion = true,
            ModelId = modelId,
            AreaId = area.Id,
            PricingRegionId = area.PricingRegionId,
            PricingRegionCode = region.Code,
            BasePrice = basePrice,
            SuggestedMinPrice = Math.Round(pricing.SuggestedMinPrice * region.Coefficient, 2),
            SuggestedMaxPrice = Math.Round(pricing.SuggestedMaxPrice * region.Coefficient, 2)
        };

        await EnrichDynamicSuggestionAsync(suggestion, model.BrandId, date, vacantRate, cancellationToken);
        return suggestion;
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

        var suggestion = await GetSuggestionAsync(vehicle.ModelId, vehicle.AreaId.Value, cancellationToken: cancellationToken);
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
            var suggestion = await GetSuggestionAsync(vehicle.ModelId, vehicle.AreaId.Value, cancellationToken: cancellationToken);
            if (suggestion.BasePrice.HasValue)
                price = suggestion.BasePrice.Value;
        }

        var area = vehicle.AreaId.HasValue
            ? await _repository.GetAreaByIdAsync(vehicle.AreaId.Value, cancellationToken)
            : null;

        var rules = await _repository.GetActivePricingRulesForVehicleAsync(vehicle, area?.PricingRegionId, date, cancellationToken);

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

    private async Task EnrichDynamicSuggestionAsync(
        PricingSuggestionResponse suggestion,
        int brandId,
        DateOnly? date,
        decimal? vacantRate,
        CancellationToken cancellationToken)
    {
        if (!suggestion.BasePrice.HasValue)
            return;

        try
        {
            var vehicleType = await _repository.VehicleBrands
                .Where(x => x.Id == brandId)
                .Select(x => x.VehicleType)
                .FirstOrDefaultAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(vehicleType))
                return;

            var result = await _dynamicPricingClient.SuggestAsync(new DynamicPricingSuggestionRequest
            {
                VehicleType = NormalizeVehicleType(vehicleType),
                Date = date ?? DateOnly.FromDateTime(DateTime.UtcNow),
                VacantRate = vacantRate ?? 1m,
                BasePrice = suggestion.BasePrice.Value
            }, cancellationToken);

            suggestion.DynamicSuggestedPrice = result.SuggestedPrice;
            suggestion.DynamicFormattedSuggestedPrice = result.FormattedSuggestedPrice;
            suggestion.DynamicPricingMultiplier = result.Multiplier;
            suggestion.DynamicPricingAppliedRules = result.AppliedRules;
            suggestion.DynamicIsWeekend = result.IsWeekend;
            suggestion.DynamicIsHoliday = result.IsHoliday;
            suggestion.DynamicIsLowVacancy = result.IsLowVacancy;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException)
        {
            _logger.LogWarning(ex, "Dynamic pricing suggestion failed for model {ModelId}, area {AreaId}.", suggestion.ModelId, suggestion.AreaId);
        }
    }

    private static string NormalizeVehicleType(string value)
        => value.Trim().Equals("Motorcycle", StringComparison.OrdinalIgnoreCase) ? "Motorbike" : value.Trim();
}
