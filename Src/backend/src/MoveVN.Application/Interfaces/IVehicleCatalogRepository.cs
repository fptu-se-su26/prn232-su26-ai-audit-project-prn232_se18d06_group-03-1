using MoveVN.Domain.Entities;

namespace MoveVN.Application.Interfaces;

public interface IVehicleCatalogRepository
{
    IQueryable<VehicleBrand> VehicleBrands { get; }
    IQueryable<VehicleModel> VehicleModels { get; }
    IQueryable<VehicleModelVariant> VehicleModelVariants { get; }
    IQueryable<DriverLicenseClass> DriverLicenseClasses { get; }
    IQueryable<DriverLicenseClassCompatibility> DriverLicenseClassCompatibility { get; }
    IQueryable<VehicleFeature> VehicleFeatures { get; }
    IQueryable<Vehicle> Vehicles { get; }
    IQueryable<VehicleImage> VehicleImages { get; }
    IQueryable<VehicleFeatureMapping> VehicleFeatureMappings { get; }
    IQueryable<VehicleDocument> VehicleDocuments { get; }
    IQueryable<Area> Areas { get; }
    IQueryable<PricingRegion> PricingRegions { get; }
    IQueryable<VehiclePricing> VehiclePricings { get; }
    IQueryable<VehicleModelPricing> VehicleModelPricings { get; }
    IQueryable<PricingRule> PricingRules { get; }

    Task<VehicleBrand?> GetVehicleBrandByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModel?> GetVehicleModelByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModelVariant?> GetVehicleModelVariantByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<DriverLicenseClass?> GetDriverLicenseClassByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleFeature?> GetVehicleFeatureByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Area?> GetAreaByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PricingRegion?> GetPricingRegionByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehiclePricing?> GetVehiclePricingByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<VehicleModelPricing?> GetVehicleModelPricingByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PricingRule?> GetPricingRuleByIdAsync(long id, CancellationToken cancellationToken = default);

    void Add<T>(T entity) where T : class;
    void Remove<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
