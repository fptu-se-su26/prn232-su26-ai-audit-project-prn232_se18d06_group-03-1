using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.PricingRules.DTOs;
using MoveVN.Application.Modules.PricingRules.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.PricingRules.Services;

public class PricingRuleService : IPricingRuleService
{
    private readonly IVehicleCatalogRepository _repository;

    public PricingRuleService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<PricingRuleResponse>> GetAllAsync(string? keyword, long? vehicleId, string? ruleType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.PricingRules;

        if (vehicleId.HasValue)
            query = query.Where(x => x.VehicleId == vehicleId.Value);

        if (!string.IsNullOrWhiteSpace(ruleType))
            query = query.Where(x => x.RuleType == ruleType);

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => _repository.Vehicles.Any(v => v.Id == x.VehicleId && v.LicensePlate.ToLower().Contains(kw)));
        }

        query = query.OrderBy(x => x.VehicleId).ThenBy(x => x.Priority).ThenBy(x => x.Id);
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
        await ValidateVehicleAsync(request.VehicleId, cancellationToken);

        var entity = new PricingRule
        {
            VehicleId = request.VehicleId,
            RuleType = request.RuleType,
            Multiplier = request.RuleType == PricingRuleTypes.Multiplier ? request.Multiplier : null,
            FixedPrice = request.RuleType == PricingRuleTypes.FixedPrice ? request.FixedPrice : null,
            Priority = request.Priority,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = true
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<PricingRuleResponse> UpdateAsync(long id, UpdatePricingRuleRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPricingRuleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_RULE_NOT_FOUND);
        await ValidateVehicleAsync(request.VehicleId, cancellationToken);

        entity.VehicleId = request.VehicleId;
        entity.RuleType = request.RuleType;
        entity.Multiplier = request.RuleType == PricingRuleTypes.Multiplier ? request.Multiplier : null;
        entity.FixedPrice = request.RuleType == PricingRuleTypes.FixedPrice ? request.FixedPrice : null;
        entity.Priority = request.Priority;
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.IsActive = request.IsActive;

        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPricingRuleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_RULE_NOT_FOUND);

        entity.IsActive = false;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<PricingRuleResponse> Project(IQueryable<PricingRule> query)
        => query.Select(x => new PricingRuleResponse
        {
            Id = x.Id,
            VehicleId = x.VehicleId,
            LicensePlate = _repository.Vehicles.Where(v => v.Id == x.VehicleId).Select(v => v.LicensePlate).FirstOrDefault() ?? "",
            RuleType = x.RuleType,
            Multiplier = x.Multiplier,
            FixedPrice = x.FixedPrice,
            Priority = x.Priority,
            StartDate = x.StartDate,
            EndDate = x.EndDate,
            IsActive = x.IsActive
        });

    private async Task ValidateVehicleAsync(long vehicleId, CancellationToken cancellationToken)
    {
        var exists = await _repository.Vehicles.AnyAsync(x => x.Id == vehicleId, cancellationToken);
        if (!exists)
            throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);
    }
}
