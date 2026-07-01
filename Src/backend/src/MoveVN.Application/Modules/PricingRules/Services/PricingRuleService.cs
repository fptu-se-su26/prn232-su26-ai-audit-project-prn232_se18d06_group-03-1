using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.PricingRules.DTOs;
using MoveVN.Application.Modules.PricingRules.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.PricingRules.Services;

public class PricingRuleService : IPricingRuleService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IPricingCalculatorService _pricingCalculator;

    public PricingRuleService(IVehicleCatalogRepository repository, IPricingCalculatorService pricingCalculator)
    {
        _repository = repository;
        _pricingCalculator = pricingCalculator;
    }

    public async Task<PagedResult<PricingRuleResponse>> GetAllAsync(string? keyword, int? brandId, int? modelId, int? pricingRegionId, string? ruleType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default)
        => await _repository.GetPricingRulesAsync(keyword, brandId, modelId, pricingRegionId, ruleType, isActive, page, pageSize, cancellationToken);

    public async Task<PricingRuleResponse> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var response = await _repository.GetPricingRuleResponseByIdAsync(id, cancellationToken);
        return response ?? throw new AppException(ErrorCode.PRICING_RULE_NOT_FOUND);
    }

    public async Task<PricingRuleResponse> CreateAsync(CreatePricingRuleRequest request, CancellationToken cancellationToken = default)
    {
        if (request.BrandId.HasValue)
        {
            var brandExists = await _repository.VehicleBrandExistsAsync(request.BrandId.Value, cancellationToken);
            if (!brandExists)
                throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        }

        if (request.ModelId.HasValue)
        {
            var modelExists = await _repository.VehicleModelExistsAsync(request.ModelId.Value, cancellationToken);
            if (!modelExists)
                throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        }

        if (request.PricingRegionId.HasValue)
        {
            var regionExists = await _repository.PricingRegionExistsAsync(request.PricingRegionId.Value, cancellationToken);
            if (!regionExists)
                throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);
        }

        var entity = new PricingRule
        {
            Name = request.Name,
            RuleType = request.RuleType,
            Multiplier = request.RuleType == PricingRuleTypes.Multiplier ? request.Multiplier : null,
            FixedPrice = request.RuleType == PricingRuleTypes.FixedPrice ? request.FixedPrice : null,
            BrandId = request.BrandId,
            ModelId = request.ModelId,
            PricingRegionId = request.PricingRegionId,
            Priority = request.Priority,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = true
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);
        await RecalculateAutoVehiclePricesAsync([GetScope(entity)], cancellationToken);
        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<PricingRuleResponse> UpdateAsync(long id, UpdatePricingRuleRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPricingRuleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_RULE_NOT_FOUND);
        var previousScope = GetScope(entity);

        if (request.BrandId.HasValue)
        {
            var brandExists = await _repository.VehicleBrandExistsAsync(request.BrandId.Value, cancellationToken);
            if (!brandExists)
                throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        }

        if (request.ModelId.HasValue)
        {
            var modelExists = await _repository.VehicleModelExistsAsync(request.ModelId.Value, cancellationToken);
            if (!modelExists)
                throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        }

        if (request.PricingRegionId.HasValue)
        {
            var regionExists = await _repository.PricingRegionExistsAsync(request.PricingRegionId.Value, cancellationToken);
            if (!regionExists)
                throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);
        }

        entity.Name = request.Name;
        entity.RuleType = request.RuleType;
        entity.Multiplier = request.RuleType == PricingRuleTypes.Multiplier ? request.Multiplier : null;
        entity.FixedPrice = request.RuleType == PricingRuleTypes.FixedPrice ? request.FixedPrice : null;
        entity.BrandId = request.BrandId;
        entity.ModelId = request.ModelId;
        entity.PricingRegionId = request.PricingRegionId;
        entity.Priority = request.Priority;
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.IsActive = request.IsActive;

        await _repository.SaveChangesAsync(cancellationToken);
        await RecalculateAutoVehiclePricesAsync([previousScope, GetScope(entity)], cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPricingRuleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_RULE_NOT_FOUND);
        var previousScope = GetScope(entity);

        entity.IsActive = false;
        await _repository.SaveChangesAsync(cancellationToken);
        await RecalculateAutoVehiclePricesAsync([previousScope], cancellationToken);
    }

    private static PricingRuleScope GetScope(PricingRule rule)
        => new(rule.BrandId, rule.ModelId, rule.PricingRegionId);

    private async Task RecalculateAutoVehiclePricesAsync(IReadOnlyCollection<PricingRuleScope> scopes, CancellationToken cancellationToken)
    {
        if (scopes.Count == 0)
            return;

        var affectedByScope = await _repository.GetAffectedAutoVehiclePricingsAsync(scopes, cancellationToken);

        if (affectedByScope.Count == 0)
            return;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        foreach (var item in affectedByScope)
        {
            var request = new UpdateVehiclePricingRequest
            {
                PricingMode = PricingModes.Auto,
                AutoMinPrice = item.Pricing.AutoMinPrice,
                AutoMaxPrice = item.Pricing.AutoMaxPrice
            };

            var currentPrice = await _pricingCalculator.CalculateCurrentPriceAsync(item.Vehicle, request, today, cancellationToken);
            item.Pricing.CurrentPricePerDay = currentPrice;
            item.Pricing.LastCalculatedAt = DateTime.UtcNow;
            item.Pricing.LastUpdatedAt = DateTime.UtcNow;
            item.Vehicle.PricePerDay = currentPrice;
        }

        await _repository.SaveChangesAsync(cancellationToken);
    }

}
