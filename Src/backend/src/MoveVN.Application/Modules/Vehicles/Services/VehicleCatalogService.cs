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
}