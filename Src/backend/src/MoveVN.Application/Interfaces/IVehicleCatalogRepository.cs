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

    Task<VehicleBrand?> GetVehicleBrandByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModel?> GetVehicleModelByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModelVariant?> GetVehicleModelVariantByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<DriverLicenseClass?> GetDriverLicenseClassByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleFeature?> GetVehicleFeatureByIdAsync(int id, CancellationToken cancellationToken = default);

    void Add<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
