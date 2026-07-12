using MoveVN.Domain.Entities;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.PricingRules.DTOs;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Interfaces;

public readonly record struct PricingRuleScope(int? BrandId, int? ModelId, int? PricingRegionId);

public sealed record AffectedAutoVehiclePricing(VehiclePricing Pricing, Vehicle Vehicle, int? PricingRegionId);

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
    IQueryable<PlatformFeeRule> PlatformFeeRules { get; }
    IQueryable<BlockedDate> BlockedDates { get; }
    IQueryable<Booking> Bookings { get; }

    Task<VehicleBrand?> GetVehicleBrandByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModel?> GetVehicleModelByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModelVariant?> GetVehicleModelVariantByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<DriverLicenseClass?> GetDriverLicenseClassByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<string>> GetAllowedVehicleTypesForDriverLicenseClassesAsync(IReadOnlyCollection<string> licenseClassCodes, CancellationToken cancellationToken = default);
    Task<VehicleFeature?> GetVehicleFeatureByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Area?> GetAreaByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PricingRegion?> GetPricingRegionByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehiclePricing?> GetVehiclePricingByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<VehicleModelPricing?> GetVehicleModelPricingByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PricingRule?> GetPricingRuleByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<PlatformFeeRule?> GetPlatformFeeRuleByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<Vehicle?> GetVehicleByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<Vehicle?> GetVehicleByIdAndOwnerIdAsync(long id, long ownerId, CancellationToken cancellationToken = default);
    Task<bool> VehicleBrandExistsAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> VehicleModelExistsAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> PricingRegionExistsAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModelPricing?> GetActiveVehicleModelPricingByModelIdAsync(int modelId, CancellationToken cancellationToken = default);
    Task<List<PricingRule>> GetActivePricingRulesForVehicleAsync(Vehicle vehicle, int? pricingRegionId, DateOnly date, CancellationToken cancellationToken = default);
    Task<List<AffectedAutoVehiclePricing>> GetAffectedAutoVehiclePricingsAsync(IReadOnlyCollection<PricingRuleScope> scopes, CancellationToken cancellationToken = default);
    Task<PagedResult<PricingRuleResponse>> GetPricingRulesAsync(string? keyword, int? brandId, int? modelId, int? pricingRegionId, string? ruleType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PricingRuleResponse?> GetPricingRuleResponseByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<PagedResult<VehicleListItemResponse>> GetOwnerVehiclesAsync(long ownerId, string? type, string? keyword, string? sortBy, int page, int pageSize, int? brandId, int? modelId, string? status, string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity, CancellationToken cancellationToken = default);
    Task<List<VehicleImageResponse>> GetVehicleImageResponsesAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<List<VehicleFeatureResponse>> GetVehicleFeatureResponsesAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<List<VehicleDocument>> GetVehicleDocumentsAsync(long vehicleId, bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<List<VehicleDocument>> GetCurrentVehicleDocumentsAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<List<VehicleFeatureMapping>> GetVehicleFeatureMappingsAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<List<VehicleDocument>> GetReplacedVehicleDocumentsForCleanupAsync(long vehicleId, long currentDocumentId, CancellationToken cancellationToken = default);
    Task<int> CountActiveVehicleFeaturesAsync(IReadOnlyCollection<int> ids, string normalizedVehicleType, CancellationToken cancellationToken = default);
    Task<PagedResult<VehicleModerationListItem>> GetModerationVehiclesAsync(IReadOnlyCollection<string>? statuses, IReadOnlyCollection<VehicleDocumentVerificationStatus>? documentStatuses, string? keyword, string? vehicleType, int? brandId, int? modelId, string? fuelType, string? seatCount, string? transmission, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<bool> HasVerifiedCurrentDocumentAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<VehicleDocument?> GetVehicleDocumentAsync(long vehicleId, long documentId, CancellationToken cancellationToken = default);
    Task<PagedResult<VehicleListItemResponse>> GetAvailableVehiclesAsync(string? type, string? keyword, string? sortBy, int page, int pageSize, int? brandId, int? modelId, string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity, decimal? priceFrom, decimal? priceTo, string? featureIds, DateTime? searchStartDate = null, DateTime? searchEndDate = null, string? brandIds = null, string? transmissions = null, string? fuelTypes = null, string? bodyTypes = null, string? bikeTypes = null, int? areaId = null, CancellationToken cancellationToken = default);
    Task<List<BusyPeriod>> GetVehicleBusyPeriodsAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<List<CatalogBrandResponse>> GetCatalogBrandsAsync(string? vehicleType, CancellationToken cancellationToken = default);
    Task<List<CatalogModelResponse>> GetCatalogModelsAsync(int? brandId, CancellationToken cancellationToken = default);
    Task<List<CatalogVariantResponse>> GetCatalogVariantsAsync(int? modelId, string? vehicleType, CancellationToken cancellationToken = default);
    Task<List<CatalogFeatureResponse>> GetCatalogFeaturesAsync(string? vehicleType, CancellationToken cancellationToken = default);
    Task<List<CatalogAreaResponse>> GetCatalogAreasAsync(string? province, int? pricingRegionId, CancellationToken cancellationToken = default);
    Task<List<CatalogPricingRegionResponse>> GetCatalogPricingRegionsAsync(CancellationToken cancellationToken = default);

    void Add<T>(T entity) where T : class;
    void Remove<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
