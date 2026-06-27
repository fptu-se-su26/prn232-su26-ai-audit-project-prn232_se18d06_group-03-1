using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.PricingRegions.DTOs;
using MoveVN.Application.Modules.PricingRegions.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.PricingRegions.Services;

public class PricingRegionService : IPricingRegionService
{
    private readonly IVehicleCatalogRepository _repository;

    public PricingRegionService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<PricingRegionResponse>> GetAllAsync(string? keyword, string? sortBy, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.PricingRegions;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Code.ToLower().Contains(kw) || x.Description != null && x.Description.ToLower().Contains(kw));
        }

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        query = sortBy switch
        {
            "code_asc" => query.OrderBy(x => x.Code),
            "code_desc" => query.OrderByDescending(x => x.Code),
            _ => query.OrderByDescending(x => x.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new PricingRegionResponse
            {
                Id = x.Id,
                Code = x.Code,
                Description = x.Description,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<PricingRegionResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public async Task<PricingRegionResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPricingRegionByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);

        return ToResponse(entity);
    }

    public async Task<PricingRegionResponse> CreateAsync(CreatePricingRegionRequest request, CancellationToken cancellationToken = default)
    {
        var code = request.Code.Trim();
        await EnsureCodeUniqueAsync(code, null, cancellationToken);

        var entity = new PricingRegion
        {
            Code = code,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<PricingRegionResponse> UpdateAsync(int id, UpdatePricingRegionRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPricingRegionByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);

        var code = request.Code.Trim();
        await EnsureCodeUniqueAsync(code, id, cancellationToken);

        entity.Code = code;
        entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        entity.IsActive = request.IsActive;

        await _repository.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetPricingRegionByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);

        entity.IsActive = false;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureCodeUniqueAsync(string code, int? excludeId, CancellationToken cancellationToken)
    {
        var normalized = code.ToLower();
        var exists = await _repository.PricingRegions
            .AnyAsync(x => x.Code.ToLower() == normalized && (!excludeId.HasValue || x.Id != excludeId.Value), cancellationToken);
        if (exists)
            throw new AppException(ErrorCode.PRICING_DUPLICATED);
    }

    private static PricingRegionResponse ToResponse(PricingRegion entity) => new()
    {
        Id = entity.Id,
        Code = entity.Code,
        Description = entity.Description,
        IsActive = entity.IsActive
    };
}
