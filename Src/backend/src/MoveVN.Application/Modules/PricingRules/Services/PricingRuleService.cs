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
    private readonly record struct RuleScope(int? BrandId, int? ModelId, int? PricingRegionId);

    public PricingRuleService(IVehicleCatalogRepository repository, IPricingCalculatorService pricingCalculator)
    {
        _repository = repository;
        _pricingCalculator = pricingCalculator;
    }

    public async Task<PagedResult<PricingRuleResponse>> GetAllAsync(string? keyword, int? brandId, int? modelId, int? pricingRegionId, string? ruleType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.PricingRules;

        if (brandId.HasValue)
            query = query.Where(x => x.BrandId == brandId.Value);

        if (modelId.HasValue)
            query = query.Where(x => x.ModelId == modelId.Value);

        if (pricingRegionId.HasValue)
            query = query.Where(x => x.PricingRegionId == pricingRegionId.Value);

        if (!string.IsNullOrWhiteSpace(ruleType))
            query = query.Where(x => x.RuleType == ruleType);

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(kw));
        }

        query = query.OrderBy(x => x.Priority).ThenBy(x => x.Id);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await Project(query).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return new PagedResult<PricingRuleResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public async Task<PricingRuleResponse> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var response = await Project(_repository.PricingRules.Where(x => x.Id == id)).FirstOrDefaultAsync(cancellationToken);
        return response ?? throw new AppException(ErrorCode.PRICING_RULE_NOT_FOUND);
    }

    public async Task<PricingRuleResponse> CreateAsync(CreatePricingRuleRequest request, CancellationToken cancellationToken = default)
    {
        if (request.BrandId.HasValue)
        {
            var brandExists = await _repository.VehicleBrands.AnyAsync(x => x.Id == request.BrandId.Value, cancellationToken);
            if (!brandExists)
                throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        }

        if (request.ModelId.HasValue)
        {
            var modelExists = await _repository.VehicleModels.AnyAsync(x => x.Id == request.ModelId.Value, cancellationToken);
            if (!modelExists)
                throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        }

        if (request.PricingRegionId.HasValue)
        {
            var regionExists = await _repository.PricingRegions.AnyAsync(x => x.Id == request.PricingRegionId.Value, cancellationToken);
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
            var brandExists = await _repository.VehicleBrands.AnyAsync(x => x.Id == request.BrandId.Value, cancellationToken);
            if (!brandExists)
                throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        }

        if (request.ModelId.HasValue)
        {
            var modelExists = await _repository.VehicleModels.AnyAsync(x => x.Id == request.ModelId.Value, cancellationToken);
            if (!modelExists)
                throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        }

        if (request.PricingRegionId.HasValue)
        {
            var regionExists = await _repository.PricingRegions.AnyAsync(x => x.Id == request.PricingRegionId.Value, cancellationToken);
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

    private static RuleScope GetScope(PricingRule rule)
        => new(rule.BrandId, rule.ModelId, rule.PricingRegionId);

    private async Task RecalculateAutoVehiclePricesAsync(IReadOnlyCollection<RuleScope> scopes, CancellationToken cancellationToken)
    {
        if (scopes.Count == 0)
            return;

        var affected = await (
            from pricing in _repository.VehiclePricings
            join vehicle in _repository.Vehicles on pricing.VehicleId equals vehicle.Id
            join area in _repository.Areas on vehicle.AreaId equals area.Id into areaJoin
            from area in areaJoin.DefaultIfEmpty()
            where pricing.PricingMode == PricingModes.Auto
                && pricing.AutoMinPrice.HasValue
                && pricing.AutoMaxPrice.HasValue
            select new
            {
                Pricing = pricing,
                Vehicle = vehicle,
                PricingRegionId = area != null ? (int?)area.PricingRegionId : null
            })
            .ToListAsync(cancellationToken);

        var affectedByScope = affected
            .Where(x => scopes.Any(scope =>
                (!scope.BrandId.HasValue || x.Vehicle.BrandId == scope.BrandId.Value)
                && (!scope.ModelId.HasValue || x.Vehicle.ModelId == scope.ModelId.Value)
                && (!scope.PricingRegionId.HasValue || x.PricingRegionId == scope.PricingRegionId.Value)))
            .GroupBy(x => x.Pricing.VehicleId)
            .Select(x => x.First())
            .ToList();

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

    private IQueryable<PricingRuleResponse> Project(IQueryable<PricingRule> query)
        => query.Select(x => new PricingRuleResponse
        {
            Id = x.Id,
            Name = x.Name,
            RuleType = x.RuleType,
            Multiplier = x.Multiplier,
            FixedPrice = x.FixedPrice,
            BrandId = x.BrandId,
            BrandName = x.BrandId.HasValue ? _repository.VehicleBrands.Where(b => b.Id == x.BrandId.Value).Select(b => b.Name).FirstOrDefault() : null,
            ModelId = x.ModelId,
            ModelName = x.ModelId.HasValue ? _repository.VehicleModels.Where(m => m.Id == x.ModelId.Value).Select(m => m.Name).FirstOrDefault() : null,
            PricingRegionId = x.PricingRegionId,
            PricingRegionCode = x.PricingRegionId.HasValue ? _repository.PricingRegions.Where(r => r.Id == x.PricingRegionId.Value).Select(r => r.Code).FirstOrDefault() : null,
            Priority = x.Priority,
            StartDate = x.StartDate,
            EndDate = x.EndDate,
            IsActive = x.IsActive
        });
}
