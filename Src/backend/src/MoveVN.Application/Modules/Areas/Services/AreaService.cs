using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Areas.DTOs;
using MoveVN.Application.Modules.Areas.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Areas.Services;

public class AreaService : IAreaService
{
    private readonly IVehicleCatalogRepository _repository;

    public AreaService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<AreaResponse>> GetAllAsync(string? keyword, string? province, int? pricingRegionId, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.Areas;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Province.ToLower().Contains(kw) || x.District.ToLower().Contains(kw));
        }

        if (!string.IsNullOrWhiteSpace(province))
        {
            var normalizedProvince = province.Trim().ToLower();
            query = query.Where(x => x.Province.ToLower().Contains(normalizedProvince));
        }

        if (pricingRegionId.HasValue)
            query = query.Where(x => x.PricingRegionId == pricingRegionId.Value);

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        query = query.OrderBy(x => x.Province).ThenBy(x => x.District);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await Project(query).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return new PagedResult<AreaResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public async Task<List<string>> GetProvincesAsync(CancellationToken cancellationToken = default)
        => await _repository.Areas
            .Select(x => x.Province)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync(cancellationToken);

    public async Task<AreaResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var response = await Project(_repository.Areas.Where(x => x.Id == id)).FirstOrDefaultAsync(cancellationToken);
        return response ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);
    }

    public async Task<AreaResponse> CreateAsync(CreateAreaRequest request, CancellationToken cancellationToken = default)
    {
        var region = await _repository.GetPricingRegionByIdAsync(request.PricingRegionId, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);
        if (!region.IsActive)
            throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);

        var province = request.Province.Trim();
        var district = request.District.Trim();
        await EnsureUniqueAsync(province, district, null, cancellationToken);

        var entity = new Area
        {
            Province = province,
            District = district,
            PricingRegionId = request.PricingRegionId,
            IsActive = true
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<AreaResponse> UpdateAsync(int id, UpdateAreaRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetAreaByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);
        var region = await _repository.GetPricingRegionByIdAsync(request.PricingRegionId, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);
        if (request.IsActive && !region.IsActive)
            throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);

        var province = request.Province.Trim();
        var district = request.District.Trim();
        await EnsureUniqueAsync(province, district, id, cancellationToken);

        entity.Province = province;
        entity.District = district;
        entity.PricingRegionId = request.PricingRegionId;
        entity.IsActive = request.IsActive;

        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetAreaByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);

        entity.IsActive = false;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<AreaResponse> Project(IQueryable<Area> query)
        => query.Select(x => new AreaResponse
        {
            Id = x.Id,
            Province = x.Province,
            District = x.District,
            PricingRegionId = x.PricingRegionId,
            PricingRegionCode = _repository.PricingRegions.Where(r => r.Id == x.PricingRegionId).Select(r => r.Code).FirstOrDefault() ?? "",
            IsActive = x.IsActive
        });

    private async Task EnsureUniqueAsync(string province, string district, int? excludeId, CancellationToken cancellationToken)
    {
        var normalizedProvince = province.ToLower();
        var normalizedDistrict = district.ToLower();
        var exists = await _repository.Areas.AnyAsync(x =>
            x.Province.ToLower() == normalizedProvince
            && x.District.ToLower() == normalizedDistrict
            && (!excludeId.HasValue || x.Id != excludeId.Value),
            cancellationToken);
        if (exists)
            throw new AppException(ErrorCode.PRICING_DUPLICATED);
    }
}
