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
        => await _repository.GetCatalogBrandsAsync(vehicleType, cancellationToken);

    public async Task<List<CatalogModelResponse>> GetModelsAsync(int? brandId, CancellationToken cancellationToken = default)
        => await _repository.GetCatalogModelsAsync(brandId, cancellationToken);

    public async Task<List<CatalogVariantResponse>> GetVariantsAsync(int? modelId, string? vehicleType, CancellationToken cancellationToken = default)
        => await _repository.GetCatalogVariantsAsync(modelId, vehicleType, cancellationToken);

    public async Task<List<CatalogFeatureResponse>> GetFeaturesAsync(string? vehicleType, CancellationToken cancellationToken = default)
        => await _repository.GetCatalogFeaturesAsync(vehicleType, cancellationToken);

    public async Task<List<CatalogAreaResponse>> GetAreasAsync(string? province, int? pricingRegionId, CancellationToken cancellationToken = default)
        => await _repository.GetCatalogAreasAsync(province, pricingRegionId, cancellationToken);

    public async Task<List<CatalogPricingRegionResponse>> GetPricingRegionsAsync(CancellationToken cancellationToken = default)
        => await _repository.GetCatalogPricingRegionsAsync(cancellationToken);
}
