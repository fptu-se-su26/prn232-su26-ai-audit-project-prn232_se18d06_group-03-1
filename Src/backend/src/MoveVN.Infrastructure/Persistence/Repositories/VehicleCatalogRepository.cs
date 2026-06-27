using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class VehicleCatalogRepository : IVehicleCatalogRepository
{
    private readonly AppDbContext _context;

    public VehicleCatalogRepository(AppDbContext context)
    {
        _context = context;
    }

    public IQueryable<VehicleBrand> VehicleBrands => _context.VehicleBrand.AsQueryable();
    public IQueryable<VehicleModel> VehicleModels => _context.VehicleModel.AsQueryable();
    public IQueryable<VehicleModelVariant> VehicleModelVariants => _context.VehicleModelVariant.AsQueryable();
    public IQueryable<DriverLicenseClass> DriverLicenseClasses => _context.DriverLicenseClasses.AsQueryable();
    public IQueryable<DriverLicenseClassCompatibility> DriverLicenseClassCompatibility => _context.DriverLicenseClassCompatibility.AsQueryable();
    public IQueryable<VehicleFeature> VehicleFeatures => _context.VehicleFeature.AsQueryable();
    public IQueryable<Vehicle> Vehicles => _context.Vehicles.AsQueryable();
    public IQueryable<VehicleImage> VehicleImages => _context.VehicleImages.AsQueryable();
    public IQueryable<VehicleFeatureMapping> VehicleFeatureMappings => _context.VehicleFeatureMapping.AsQueryable();
    public IQueryable<VehicleDocument> VehicleDocuments => _context.VehicleDocuments.AsQueryable();
    public IQueryable<Area> Areas => _context.Area.AsQueryable();
    public IQueryable<PricingRegion> PricingRegions => _context.PricingRegion.AsQueryable();
    public IQueryable<VehiclePricing> VehiclePricings => _context.VehiclePricing.AsQueryable();
    public IQueryable<VehicleModelPricing> VehicleModelPricings => _context.VehicleModelPricing.AsQueryable();
    public IQueryable<PricingRule> PricingRules => _context.PricingRules.AsQueryable();

    public Task<VehicleBrand?> GetVehicleBrandByIdAsync(int id, CancellationToken cancellationToken = default)
        => _context.VehicleBrand.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<VehicleModel?> GetVehicleModelByIdAsync(int id, CancellationToken cancellationToken = default)
        => _context.VehicleModel.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<VehicleModelVariant?> GetVehicleModelVariantByIdAsync(int id, CancellationToken cancellationToken = default)
        => _context.VehicleModelVariant.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<DriverLicenseClass?> GetDriverLicenseClassByIdAsync(int id, CancellationToken cancellationToken = default)
        => _context.DriverLicenseClasses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<VehicleFeature?> GetVehicleFeatureByIdAsync(int id, CancellationToken cancellationToken = default)
        => _context.VehicleFeature.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Area?> GetAreaByIdAsync(int id, CancellationToken cancellationToken = default)
        => _context.Area.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<PricingRegion?> GetPricingRegionByIdAsync(int id, CancellationToken cancellationToken = default)
        => _context.PricingRegion.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<VehiclePricing?> GetVehiclePricingByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default)
        => _context.VehiclePricing.FirstOrDefaultAsync(x => x.VehicleId == vehicleId, cancellationToken);

    public Task<VehicleModelPricing?> GetVehicleModelPricingByIdAsync(int id, CancellationToken cancellationToken = default)
        => _context.VehicleModelPricing.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<PricingRule?> GetPricingRuleByIdAsync(long id, CancellationToken cancellationToken = default)
        => _context.PricingRules.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public void Add<T>(T entity) where T : class
        => _context.Set<T>().Add(entity);

    public void Remove<T>(T entity) where T : class
        => _context.Set<T>().Remove(entity);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
