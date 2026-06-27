using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IVehicleCatalogService
{
    Task<List<CatalogBrandResponse>> GetBrandsAsync(string? vehicleType, CancellationToken cancellationToken = default);
    Task<List<CatalogModelResponse>> GetModelsAsync(int? brandId, CancellationToken cancellationToken = default);
    Task<List<CatalogVariantResponse>> GetVariantsAsync(int? modelId, string? vehicleType, CancellationToken cancellationToken = default);
    Task<List<CatalogFeatureResponse>> GetFeaturesAsync(string? vehicleType, CancellationToken cancellationToken = default);
}