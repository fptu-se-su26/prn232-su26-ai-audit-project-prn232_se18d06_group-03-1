using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehicleModelPricings.DTOs;
using MoveVN.Application.Modules.VehicleModelPricings.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.VehicleModelPricings.Services;

public class VehicleModelPricingService : IVehicleModelPricingService
{
    private readonly IVehicleCatalogRepository _repository;

    public VehicleModelPricingService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<VehicleModelPricingResponse>> GetAllAsync(string? keyword, string? sortBy, string? vehicleType, int? brandId, int? modelId, int? pricingRegionId, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleModelPricings;

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        if (modelId.HasValue)
            query = query.Where(x => x.ModelId == modelId.Value);

        if (pricingRegionId.HasValue)
            query = query.Where(x => x.PricingRegionId == pricingRegionId.Value);

        if (brandId.HasValue)
            query = query.Where(x => _repository.VehicleModels.Any(m => m.Id == x.ModelId && m.BrandId == brandId.Value));

        if (!string.IsNullOrWhiteSpace(vehicleType))
        {
            var normalizedVehicleType = NormalizeVehicleType(vehicleType);
            query = normalizedVehicleType == "Motorbike"
                ? query.Where(x => _repository.VehicleModels.Any(m => m.Id == x.ModelId
                    && _repository.VehicleBrands.Any(b => b.Id == m.BrandId && (b.VehicleType == "Motorbike" || b.VehicleType == "Motorcycle"))))
                : query.Where(x => _repository.VehicleModels.Any(m => m.Id == x.ModelId
                    && _repository.VehicleBrands.Any(b => b.Id == m.BrandId && b.VehicleType == normalizedVehicleType)));
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x =>
                _repository.VehicleModels.Any(m => m.Id == x.ModelId && m.Name.ToLower().Contains(kw))
                || _repository.PricingRegions.Any(r => r.Id == x.PricingRegionId && r.Code.ToLower().Contains(kw)));
        }

        query = sortBy switch
        {
            "price_asc" => query.OrderBy(x => x.BasePrice),
            "price_desc" => query.OrderByDescending(x => x.BasePrice),
            _ => query.OrderByDescending(x => x.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await Project(query).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return new PagedResult<VehicleModelPricingResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public async Task<VehicleModelPricingResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var response = await Project(_repository.VehicleModelPricings.Where(x => x.Id == id)).FirstOrDefaultAsync(cancellationToken);
        return response ?? throw new AppException(ErrorCode.VEHICLE_MODEL_PRICING_NOT_FOUND);
    }

    public async Task<VehicleModelPricingResponse> CreateAsync(CreateVehicleModelPricingRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateReferencesAsync(request.ModelId, request.PricingRegionId, requireActive: true, cancellationToken);
        await EnsureUniqueAsync(request.ModelId, request.PricingRegionId, null, cancellationToken);

        var entity = new VehicleModelPricing
        {
            ModelId = request.ModelId,
            PricingRegionId = request.PricingRegionId,
            BasePrice = request.BasePrice,
            SuggestedMinPrice = request.SuggestedMinPrice,
            SuggestedMaxPrice = request.SuggestedMaxPrice,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<VehicleModelPricingResponse> UpdateAsync(int id, UpdateVehicleModelPricingRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleModelPricingByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_PRICING_NOT_FOUND);

        await ValidateReferencesAsync(request.ModelId, request.PricingRegionId, request.IsActive, cancellationToken);
        if (request.IsActive)
            await EnsureUniqueAsync(request.ModelId, request.PricingRegionId, id, cancellationToken);

        entity.ModelId = request.ModelId;
        entity.PricingRegionId = request.PricingRegionId;
        entity.BasePrice = request.BasePrice;
        entity.SuggestedMinPrice = request.SuggestedMinPrice;
        entity.SuggestedMaxPrice = request.SuggestedMaxPrice;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleModelPricingByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_PRICING_NOT_FOUND);

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<VehicleModelPricingResponse> Project(IQueryable<VehicleModelPricing> query)
        => query.Select(x => new VehicleModelPricingResponse
        {
            Id = x.Id,
            ModelId = x.ModelId,
            ModelName = _repository.VehicleModels.Where(m => m.Id == x.ModelId).Select(m => m.Name).FirstOrDefault() ?? "",
            BrandId = _repository.VehicleModels.Where(m => m.Id == x.ModelId).Select(m => m.BrandId).FirstOrDefault(),
            BrandName = _repository.VehicleModels.Where(m => m.Id == x.ModelId).Select(m => _repository.VehicleBrands.Where(b => b.Id == m.BrandId).Select(b => b.Name).FirstOrDefault()).FirstOrDefault() ?? "",
            VehicleType = _repository.VehicleModels.Where(m => m.Id == x.ModelId).Select(m => _repository.VehicleBrands.Where(b => b.Id == m.BrandId).Select(b => b.VehicleType).FirstOrDefault()).FirstOrDefault() ?? "",
            PricingRegionId = x.PricingRegionId,
            PricingRegionCode = _repository.PricingRegions.Where(r => r.Id == x.PricingRegionId).Select(r => r.Code).FirstOrDefault() ?? "",
            BasePrice = x.BasePrice,
            SuggestedMinPrice = x.SuggestedMinPrice,
            SuggestedMaxPrice = x.SuggestedMaxPrice,
            IsActive = x.IsActive,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt
        });

    private async Task ValidateReferencesAsync(int modelId, int pricingRegionId, bool requireActive, CancellationToken cancellationToken)
    {
        var model = await _repository.GetVehicleModelByIdAsync(modelId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        var region = await _repository.GetPricingRegionByIdAsync(pricingRegionId, cancellationToken)
            ?? throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);

        if (requireActive && (!model.IsActive || !region.IsActive))
            throw new AppException(ErrorCode.PRICING_REGION_NOT_FOUND);
    }

    private async Task EnsureUniqueAsync(int modelId, int pricingRegionId, int? excludeId, CancellationToken cancellationToken)
    {
        var exists = await _repository.VehicleModelPricings.AnyAsync(x =>
            x.ModelId == modelId
            && x.PricingRegionId == pricingRegionId
            && x.IsActive
            && (!excludeId.HasValue || x.Id != excludeId.Value),
            cancellationToken);
        if (exists)
            throw new AppException(ErrorCode.PRICING_DUPLICATED);
    }

    private static string NormalizeVehicleType(string value)
        => value.Equals("Motorcycle", StringComparison.OrdinalIgnoreCase) ? "Motorbike" : value;
}
