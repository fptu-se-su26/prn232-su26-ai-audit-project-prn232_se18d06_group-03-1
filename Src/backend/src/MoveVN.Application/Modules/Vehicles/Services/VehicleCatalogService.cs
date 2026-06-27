using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class VehicleCatalogService : IVehicleCatalogService
{
    private readonly IVehicleCatalogRepository _repository;

    public VehicleCatalogService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CatalogBrandResponse>> GetBrandsAsync(string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleBrands.Where(b => b.IsActive);

        if (!string.IsNullOrWhiteSpace(vehicleType))
            query = query.Where(b => b.VehicleType == vehicleType);

        return await query
            .OrderBy(b => b.Name)
            .Select(b => new CatalogBrandResponse
            {
                Id = b.Id,
                Name = b.Name,
                VehicleType = b.VehicleType
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CatalogModelResponse>> GetModelsAsync(int? brandId, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleModels.Where(m => m.IsActive);

        if (brandId.HasValue)
            query = query.Where(m => m.BrandId == brandId.Value);

        return await query
            .OrderBy(m => m.Name)
            .Select(m => new CatalogModelResponse
            {
                Id = m.Id,
                BrandId = m.BrandId,
                Name = m.Name
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CatalogVariantResponse>> GetVariantsAsync(int? modelId, string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleModelVariants.Where(v => v.IsActive);

        if (modelId.HasValue)
            query = query.Where(v => v.ModelId == modelId.Value);

        if (!string.IsNullOrWhiteSpace(vehicleType))
            query = query.Where(v => v.VehicleType == vehicleType);

        return await query
            .OrderBy(v => v.Name)
            .Select(v => new CatalogVariantResponse
            {
                Id = v.Id,
                ModelId = v.ModelId,
                Name = v.Name,
                VehicleType = v.VehicleType,
                SeatCount = v.SeatCount,
                Transmission = v.Transmission,
                FuelType = v.FuelType,
                BodyType = v.BodyType,
                BikeType = v.BikeType,
                EngineCapacity = v.EngineCapacity
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CatalogFeatureResponse>> GetFeaturesAsync(string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleFeatures.Where(f => f.IsActive);

        if (!string.IsNullOrWhiteSpace(vehicleType))
            query = query.Where(f => f.VehicleType == vehicleType);

        return await query
            .OrderBy(f => f.Name)
            .Select(f => new CatalogFeatureResponse
            {
                Id = f.Id,
                Name = f.Name,
                VehicleType = f.VehicleType
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CatalogAreaResponse>> GetAreasAsync(string? province, int? pricingRegionId, CancellationToken cancellationToken = default)
    {
        var query = _repository.Areas.Where(a => a.IsActive);

        if (!string.IsNullOrWhiteSpace(province))
        {
            var normalizedProvince = province.Trim().ToLower();
            query = query.Where(a => a.Province.ToLower().Contains(normalizedProvince));
        }

        if (pricingRegionId.HasValue)
            query = query.Where(a => a.PricingRegionId == pricingRegionId.Value);

        return await query
            .OrderBy(a => a.Province)
            .ThenBy(a => a.District)
            .Select(a => new CatalogAreaResponse
            {
                Id = a.Id,
                Province = a.Province,
                District = a.District,
                PricingRegionId = a.PricingRegionId,
                PricingRegionCode = _repository.PricingRegions.Where(r => r.Id == a.PricingRegionId).Select(r => r.Code).FirstOrDefault() ?? ""
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CatalogPricingRegionResponse>> GetPricingRegionsAsync(CancellationToken cancellationToken = default)
    {
        return await _repository.PricingRegions
            .Where(r => r.IsActive)
            .OrderBy(r => r.Code)
            .Select(r => new CatalogPricingRegionResponse
            {
                Id = r.Id,
                Code = r.Code,
                Description = r.Description
            })
            .ToListAsync(cancellationToken);
    }
}
