using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.PricingRules.DTOs;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

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
    public IQueryable<PlatformFeeRule> PlatformFeeRules => _context.PlatformFeeRules.AsQueryable();
    public IQueryable<BlockedDate> BlockedDates => _context.BlockedDates.AsQueryable();
    public IQueryable<Booking> Bookings => _context.Bookings.AsQueryable();

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

    public Task<PlatformFeeRule?> GetPlatformFeeRuleByIdAsync(long id, CancellationToken cancellationToken = default)
        => _context.PlatformFeeRules.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Vehicle?> GetVehicleByIdAsync(long id, CancellationToken cancellationToken = default)
        => _context.Vehicles.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Vehicle?> GetVehicleByIdAndOwnerIdAsync(long id, long ownerId, CancellationToken cancellationToken = default)
        => _context.Vehicles.FirstOrDefaultAsync(x => x.Id == id && x.OwnerId == ownerId, cancellationToken);

    public Task<bool> VehicleBrandExistsAsync(int id, CancellationToken cancellationToken = default)
        => _context.VehicleBrand.AnyAsync(x => x.Id == id, cancellationToken);

    public Task<bool> VehicleModelExistsAsync(int id, CancellationToken cancellationToken = default)
        => _context.VehicleModel.AnyAsync(x => x.Id == id, cancellationToken);

    public Task<bool> PricingRegionExistsAsync(int id, CancellationToken cancellationToken = default)
        => _context.PricingRegion.AnyAsync(x => x.Id == id, cancellationToken);

    public Task<VehicleModelPricing?> GetActiveVehicleModelPricingByModelIdAsync(int modelId, CancellationToken cancellationToken = default)
        => _context.VehicleModelPricing.FirstOrDefaultAsync(x => x.ModelId == modelId && x.IsActive, cancellationToken);

    public async Task<List<PricingRule>> GetActivePricingRulesForVehicleAsync(Vehicle vehicle, int? pricingRegionId, DateOnly date, CancellationToken cancellationToken = default)
        => await _context.PricingRules
            .Where(x => x.IsActive
                && (!x.StartDate.HasValue || x.StartDate <= date)
                && (!x.EndDate.HasValue || x.EndDate >= date)
                && (x.BrandId == null || x.BrandId == vehicle.BrandId)
                && (x.ModelId == null || x.ModelId == vehicle.ModelId)
                && (x.PricingRegionId == null || x.PricingRegionId == pricingRegionId))
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);

    public async Task<List<AffectedAutoVehiclePricing>> GetAffectedAutoVehiclePricingsAsync(IReadOnlyCollection<PricingRuleScope> scopes, CancellationToken cancellationToken = default)
    {
        var affected = await (
            from pricing in _context.VehiclePricing
            join vehicle in _context.Vehicles on pricing.VehicleId equals vehicle.Id
            join area in _context.Area on vehicle.AreaId equals area.Id into areaJoin
            from area in areaJoin.DefaultIfEmpty()
            where pricing.PricingMode == "Auto"
                && pricing.AutoMinPrice.HasValue
                && pricing.AutoMaxPrice.HasValue
            select new AffectedAutoVehiclePricing(pricing, vehicle, area != null ? (int?)area.PricingRegionId : null))
            .ToListAsync(cancellationToken);

        return affected
            .Where(x => scopes.Any(scope =>
                (!scope.BrandId.HasValue || x.Vehicle.BrandId == scope.BrandId.Value)
                && (!scope.ModelId.HasValue || x.Vehicle.ModelId == scope.ModelId.Value)
                && (!scope.PricingRegionId.HasValue || x.PricingRegionId == scope.PricingRegionId.Value)))
            .GroupBy(x => x.Pricing.VehicleId)
            .Select(x => x.First())
            .ToList();
    }

    public async Task<PagedResult<PricingRuleResponse>> GetPricingRulesAsync(string? keyword, int? brandId, int? modelId, int? pricingRegionId, string? ruleType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.PricingRules.AsQueryable();
        if (brandId.HasValue) query = query.Where(x => x.BrandId == brandId.Value);
        if (modelId.HasValue) query = query.Where(x => x.ModelId == modelId.Value);
        if (pricingRegionId.HasValue) query = query.Where(x => x.PricingRegionId == pricingRegionId.Value);
        if (!string.IsNullOrWhiteSpace(ruleType)) query = query.Where(x => x.RuleType == ruleType);
        if (isActive.HasValue) query = query.Where(x => x.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(kw));
        }

        query = query.OrderBy(x => x.Priority).ThenBy(x => x.Id);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await ProjectPricingRules(query).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<PricingRuleResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public Task<PricingRuleResponse?> GetPricingRuleResponseByIdAsync(long id, CancellationToken cancellationToken = default)
        => ProjectPricingRules(_context.PricingRules.Where(x => x.Id == id)).FirstOrDefaultAsync(cancellationToken);

    public async Task<PagedResult<VehicleListItemResponse>> GetOwnerVehiclesAsync(long ownerId, string? type, string? keyword, string? sortBy, int page, int pageSize, int? brandId, int? modelId, string? status, string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles.Where(v => v.OwnerId == ownerId);
        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(v => v.VehicleType == type);
        if (brandId.HasValue) query = query.Where(v => v.BrandId == brandId.Value);
        if (modelId.HasValue) query = query.Where(v => v.ModelId == modelId.Value);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(v => v.Status == status);
        if (!string.IsNullOrWhiteSpace(fuelType)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.FuelType == fuelType));
        if (!string.IsNullOrWhiteSpace(seatCount) && byte.TryParse(seatCount, out var seatVal)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.SeatCount == seatVal));
        if (!string.IsNullOrWhiteSpace(transmission)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.Transmission == transmission));
        if (!string.IsNullOrWhiteSpace(bodyType)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.BodyType == bodyType));
        if (!string.IsNullOrWhiteSpace(bikeType)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.BikeType == bikeType));
        if (!string.IsNullOrWhiteSpace(engineCapacity)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.EngineCapacity == engineCapacity));
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(v => v.LicensePlate.ToLower().Contains(kw)
                || v.Description != null && v.Description.ToLower().Contains(kw));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        query = sortBy switch
        {
            "price_asc" => query.OrderBy(v => v.PricePerDay),
            "price_desc" => query.OrderByDescending(v => v.PricePerDay),
            _ => query.OrderByDescending(v => v.CreatedAt)
        };

        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(v => new VehicleListItemResponse
            {
                Id = v.Id,
                BrandName = _context.VehicleBrand.Where(b => b.Id == v.BrandId).Select(b => b.Name).FirstOrDefault() ?? "",
                ModelName = _context.VehicleModel.Where(m => m.Id == v.ModelId).Select(m => m.Name).FirstOrDefault() ?? "",
                VariantName = v.VariantId != null ? _context.VehicleModelVariant.Where(var => var.Id == v.VariantId).Select(var => var.Name).FirstOrDefault() : null,
                VehicleType = v.VehicleType,
                Year = v.Year,
                LicensePlate = v.LicensePlate,
                PricePerDay = v.PricePerDay,
                AreaName = v.AreaId.HasValue ? _context.Area.Where(a => a.Id == v.AreaId.Value).Select(a => a.Province + " - " + a.District).FirstOrDefault() : null,
                PricingMode = _context.VehiclePricing.Where(p => p.VehicleId == v.Id).Select(p => p.PricingMode).FirstOrDefault(),
                Status = v.Status,
                FeaturedImage = _context.VehicleImages.Where(img => img.VehicleId == v.Id && img.IsPrimary).Select(img => img.ImageUrl).FirstOrDefault(),
                CreatedAt = v.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<VehicleListItemResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public Task<List<VehicleImageResponse>> GetVehicleImageResponsesAsync(long vehicleId, CancellationToken cancellationToken = default)
        => _context.VehicleImages.Where(img => img.VehicleId == vehicleId).OrderBy(img => img.SortOrder)
            .Select(img => new VehicleImageResponse { Id = img.Id, ImageUrl = img.ImageUrl, IsPrimary = img.IsPrimary, SortOrder = img.SortOrder })
            .ToListAsync(cancellationToken);

    public async Task<List<VehicleFeatureResponse>> GetVehicleFeatureResponsesAsync(long vehicleId, CancellationToken cancellationToken = default)
    {
        var featureIds = await _context.VehicleFeatureMapping.Where(fm => fm.VehicleId == vehicleId).Select(fm => fm.FeatureId).ToListAsync(cancellationToken);
        return await _context.VehicleFeature.Where(f => featureIds.Contains(f.Id)).Select(f => new VehicleFeatureResponse { Id = f.Id, Name = f.Name }).ToListAsync(cancellationToken);
    }

    public Task<List<VehicleDocument>> GetVehicleDocumentsAsync(long vehicleId, bool includeDeleted = false, CancellationToken cancellationToken = default)
        => _context.VehicleDocuments
            .Where(doc => doc.VehicleId == vehicleId && (includeDeleted || doc.DeletedAt == null))
            .OrderByDescending(doc => doc.IsCurrent)
            .ThenByDescending(doc => doc.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<List<VehicleDocument>> GetCurrentVehicleDocumentsAsync(long vehicleId, CancellationToken cancellationToken = default)
        => _context.VehicleDocuments.Where(doc => doc.VehicleId == vehicleId && doc.IsCurrent).ToListAsync(cancellationToken);

    public Task<List<VehicleFeatureMapping>> GetVehicleFeatureMappingsAsync(long vehicleId, CancellationToken cancellationToken = default)
        => _context.VehicleFeatureMapping.Where(fm => fm.VehicleId == vehicleId).ToListAsync(cancellationToken);

    public Task<List<VehicleDocument>> GetReplacedVehicleDocumentsForCleanupAsync(long vehicleId, long currentDocumentId, CancellationToken cancellationToken = default)
        => _context.VehicleDocuments
            .Where(doc => doc.VehicleId == vehicleId
                && doc.Id != currentDocumentId
                && doc.DeletedAt == null
                && doc.FilePublicId != null
                && (doc.VerificationStatus == VehicleDocumentVerificationStatus.Rejected
                    || doc.VerificationStatus == VehicleDocumentVerificationStatus.NeedMoreInfo
                    || doc.VerificationStatus == VehicleDocumentVerificationStatus.Failed))
            .ToListAsync(cancellationToken);

    public Task<int> CountActiveVehicleFeaturesAsync(IReadOnlyCollection<int> ids, string normalizedVehicleType, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleFeature.Where(f => ids.Contains(f.Id) && f.IsActive);
        query = normalizedVehicleType == "Motorbike"
            ? query.Where(f => f.VehicleType == "Motorbike" || f.VehicleType == "Motorcycle")
            : query.Where(f => f.VehicleType == normalizedVehicleType);
        return query.CountAsync(cancellationToken);
    }

    public async Task<PagedResult<VehicleModerationListItem>> GetModerationVehiclesAsync(IReadOnlyCollection<string>? statuses, IReadOnlyCollection<VehicleDocumentVerificationStatus>? documentStatuses, string? keyword, string? vehicleType, int? brandId, int? modelId, string? fuelType, string? seatCount, string? transmission, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles.AsQueryable();
        if (statuses is { Count: > 0 }) query = query.Where(vehicle => statuses.Contains(vehicle.Status));
        if (!string.IsNullOrWhiteSpace(vehicleType)) query = query.Where(vehicle => vehicle.VehicleType == vehicleType);
        if (brandId.HasValue) query = query.Where(vehicle => vehicle.BrandId == brandId.Value);
        if (modelId.HasValue) query = query.Where(vehicle => vehicle.ModelId == modelId.Value);
        if (!string.IsNullOrWhiteSpace(fuelType)) query = query.Where(vehicle => vehicle.VariantId != null && _context.VehicleModelVariant.Any(variant => variant.Id == vehicle.VariantId && variant.FuelType == fuelType));
        if (!string.IsNullOrWhiteSpace(seatCount) && byte.TryParse(seatCount, out var seatValue)) query = query.Where(vehicle => vehicle.VariantId != null && _context.VehicleModelVariant.Any(variant => variant.Id == vehicle.VariantId && variant.SeatCount == seatValue));
        if (!string.IsNullOrWhiteSpace(transmission)) query = query.Where(vehicle => vehicle.VariantId != null && _context.VehicleModelVariant.Any(variant => variant.Id == vehicle.VariantId && variant.Transmission == transmission));
        if (documentStatuses is { Count: > 0 })
        {
            query = query.Where(vehicle => _context.VehicleDocuments.Any(doc =>
                doc.VehicleId == vehicle.Id && doc.IsCurrent && documentStatuses.Contains(doc.VerificationStatus)));
        }
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(vehicle => vehicle.LicensePlate.ToLower().Contains(kw)
                || vehicle.Description != null && vehicle.Description.ToLower().Contains(kw));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(vehicle => vehicle.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(vehicle => new VehicleModerationListItem
            {
                Id = vehicle.Id,
                OwnerId = vehicle.OwnerId,
                BrandName = _context.VehicleBrand.Where(brand => brand.Id == vehicle.BrandId).Select(brand => brand.Name).FirstOrDefault() ?? "",
                ModelName = _context.VehicleModel.Where(model => model.Id == vehicle.ModelId).Select(model => model.Name).FirstOrDefault() ?? "",
                VehicleType = vehicle.VehicleType,
                Year = vehicle.Year,
                LicensePlate = vehicle.LicensePlate,
                PricePerDay = vehicle.PricePerDay,
                Status = vehicle.Status,
                DocumentStatus = _context.VehicleDocuments.Where(doc => doc.VehicleId == vehicle.Id && doc.IsCurrent).Select(doc => doc.VerificationStatus.ToString()).FirstOrDefault(),
                DocumentVerified = _context.VehicleDocuments.Where(doc => doc.VehicleId == vehicle.Id && doc.IsCurrent).Select(doc => doc.Verified).FirstOrDefault(),
                CreatedAt = vehicle.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<VehicleModerationListItem> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public Task<bool> HasVerifiedCurrentDocumentAsync(long vehicleId, CancellationToken cancellationToken = default)
        => _context.VehicleDocuments.AnyAsync(doc => doc.VehicleId == vehicleId && doc.IsCurrent && doc.Verified && doc.VerificationStatus == VehicleDocumentVerificationStatus.Verified, cancellationToken);

    public Task<VehicleDocument?> GetVehicleDocumentAsync(long vehicleId, long documentId, CancellationToken cancellationToken = default)
        => _context.VehicleDocuments.FirstOrDefaultAsync(doc => doc.Id == documentId && doc.VehicleId == vehicleId, cancellationToken);

    public async Task<PagedResult<VehicleListItemResponse>> GetAvailableVehiclesAsync(string? type, string? keyword, string? sortBy, int page, int pageSize, int? brandId, int? modelId, string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity, decimal? priceFrom, decimal? priceTo, string? featureIds, DateTime? searchStartDate = null, DateTime? searchEndDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles.Where(v => v.Status == VehicleStatus.Approved);
        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(v => v.VehicleType == type);
        if (brandId.HasValue) query = query.Where(v => v.BrandId == brandId.Value);
        if (modelId.HasValue) query = query.Where(v => v.ModelId == modelId.Value);
        if (!string.IsNullOrWhiteSpace(fuelType)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.FuelType == fuelType));
        if (!string.IsNullOrWhiteSpace(seatCount) && byte.TryParse(seatCount, out var seatVal)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.SeatCount == seatVal));
        if (!string.IsNullOrWhiteSpace(transmission)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.Transmission == transmission));
        if (!string.IsNullOrWhiteSpace(bodyType)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.BodyType == bodyType));
        if (!string.IsNullOrWhiteSpace(bikeType)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.BikeType == bikeType));
        if (!string.IsNullOrWhiteSpace(engineCapacity)) query = query.Where(v => v.VariantId != null && _context.VehicleModelVariant.Any(var => var.Id == v.VariantId && var.EngineCapacity == engineCapacity));
        if (priceFrom.HasValue) query = query.Where(v => v.PricePerDay >= priceFrom.Value);
        if (priceTo.HasValue) query = query.Where(v => v.PricePerDay <= priceTo.Value);
        if (!string.IsNullOrWhiteSpace(featureIds))
        {
            var ids = featureIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(id => int.TryParse(id, out var parsed) ? parsed : (int?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToList();
            if (ids.Count > 0)
            {
                query = query.Where(v => _context.VehicleFeatureMapping
                    .Where(fm => fm.VehicleId == v.Id && ids.Contains(fm.FeatureId))
                    .Select(fm => fm.FeatureId)
                    .Distinct()
                    .Count() == ids.Count);
            }
        }
        if (searchStartDate.HasValue && searchEndDate.HasValue)
        {
            var searchStartOnly = DateOnly.FromDateTime(searchStartDate.Value);
            var searchEndOnly = DateOnly.FromDateTime(searchEndDate.Value);
            query = query.Where(v => !_context.BlockedDates
                .Any(bd => bd.VehicleId == v.Id
                    && bd.StartDate <= searchEndOnly
                    && bd.EndDate >= searchStartOnly));
        }
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(v => v.LicensePlate.ToLower().Contains(kw)
                || (v.Description != null && v.Description.ToLower().Contains(kw)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        query = sortBy switch
        {
            "price_asc" => query.OrderBy(v => v.PricePerDay),
            "price_desc" => query.OrderByDescending(v => v.PricePerDay),
            "rating_desc" => query.OrderByDescending(v => _context.Reviews.Where(r => r.VehicleId == v.Id).Average(r => (double?)r.Rating) ?? 0),
            _ => query.OrderByDescending(v => v.CreatedAt)
        };

        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(v => new VehicleListItemResponse
            {
                Id = v.Id,
                BrandName = _context.VehicleBrand.Where(b => b.Id == v.BrandId).Select(b => b.Name).FirstOrDefault() ?? "",
                ModelName = _context.VehicleModel.Where(m => m.Id == v.ModelId).Select(m => m.Name).FirstOrDefault() ?? "",
                VariantName = v.VariantId != null ? _context.VehicleModelVariant.Where(var => var.Id == v.VariantId).Select(var => var.Name).FirstOrDefault() : null,
                VehicleType = v.VehicleType,
                Year = v.Year,
                LicensePlate = v.LicensePlate,
                PricePerDay = v.PricePerDay,
                AreaName = v.AreaId.HasValue ? _context.Area.Where(a => a.Id == v.AreaId.Value).Select(a => a.Province + " - " + a.District).FirstOrDefault() : null,
                PricingMode = _context.VehiclePricing.Where(p => p.VehicleId == v.Id).Select(p => p.PricingMode).FirstOrDefault(),
                Status = v.Status,
                FeaturedImage = _context.VehicleImages.Where(img => img.VehicleId == v.Id && img.IsPrimary).Select(img => img.ImageUrl).FirstOrDefault(),
                AverageRating = _context.Reviews.Where(r => r.VehicleId == v.Id && r.IsPublic).Select(r => (double?)r.Rating).Average() ?? 0,
                ReviewCount = _context.Reviews.Count(r => r.VehicleId == v.Id && r.IsPublic),
                CreatedAt = v.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<VehicleListItemResponse> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
    }

    public async Task<List<CatalogBrandResponse>> GetCatalogBrandsAsync(string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleBrand.Where(b => b.IsActive);
        if (!string.IsNullOrWhiteSpace(vehicleType)) query = query.Where(b => b.VehicleType == vehicleType);
        return await query.OrderBy(b => b.Name)
            .Select(b => new CatalogBrandResponse { Id = b.Id, Name = b.Name, VehicleType = b.VehicleType })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CatalogModelResponse>> GetCatalogModelsAsync(int? brandId, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleModel.Where(m => m.IsActive);
        if (brandId.HasValue) query = query.Where(m => m.BrandId == brandId.Value);
        return await query.OrderBy(m => m.Name)
            .Select(m => new CatalogModelResponse { Id = m.Id, BrandId = m.BrandId, Name = m.Name })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CatalogVariantResponse>> GetCatalogVariantsAsync(int? modelId, string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleModelVariant.Where(v => v.IsActive);
        if (modelId.HasValue) query = query.Where(v => v.ModelId == modelId.Value);
        if (!string.IsNullOrWhiteSpace(vehicleType)) query = query.Where(v => v.VehicleType == vehicleType);
        return await query.OrderBy(v => v.Name)
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

    public async Task<List<CatalogFeatureResponse>> GetCatalogFeaturesAsync(string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleFeature.Where(f => f.IsActive);
        if (!string.IsNullOrWhiteSpace(vehicleType)) query = query.Where(f => f.VehicleType == vehicleType);
        return await query.OrderBy(f => f.Name)
            .Select(f => new CatalogFeatureResponse { Id = f.Id, Name = f.Name, VehicleType = f.VehicleType })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CatalogAreaResponse>> GetCatalogAreasAsync(string? province, int? pricingRegionId, CancellationToken cancellationToken = default)
    {
        var query = _context.Area.Where(a => a.IsActive);
        if (!string.IsNullOrWhiteSpace(province))
        {
            var normalizedProvince = province.Trim().ToLower();
            query = query.Where(a => a.Province.ToLower().Contains(normalizedProvince));
        }
        if (pricingRegionId.HasValue) query = query.Where(a => a.PricingRegionId == pricingRegionId.Value);

        return await query.OrderBy(a => a.Province).ThenBy(a => a.District)
            .Select(a => new CatalogAreaResponse
            {
                Id = a.Id,
                Province = a.Province,
                District = a.District,
                PricingRegionId = a.PricingRegionId,
                PricingRegionCode = _context.PricingRegion.Where(r => r.Id == a.PricingRegionId).Select(r => r.Code).FirstOrDefault() ?? ""
            })
            .ToListAsync(cancellationToken);
    }

    public Task<List<CatalogPricingRegionResponse>> GetCatalogPricingRegionsAsync(CancellationToken cancellationToken = default)
        => _context.PricingRegion.Where(r => r.IsActive).OrderBy(r => r.Code)
            .Select(r => new CatalogPricingRegionResponse { Id = r.Id, Code = r.Code, Description = r.Description })
            .ToListAsync(cancellationToken);

    private IQueryable<PricingRuleResponse> ProjectPricingRules(IQueryable<PricingRule> query)
        => query.Select(x => new PricingRuleResponse
        {
            Id = x.Id,
            Name = x.Name,
            RuleType = x.RuleType,
            Multiplier = x.Multiplier,
            FixedPrice = x.FixedPrice,
            BrandId = x.BrandId,
            BrandName = x.BrandId.HasValue ? _context.VehicleBrand.Where(b => b.Id == x.BrandId.Value).Select(b => b.Name).FirstOrDefault() : null,
            ModelId = x.ModelId,
            ModelName = x.ModelId.HasValue ? _context.VehicleModel.Where(m => m.Id == x.ModelId.Value).Select(m => m.Name).FirstOrDefault() : null,
            PricingRegionId = x.PricingRegionId,
            PricingRegionCode = x.PricingRegionId.HasValue ? _context.PricingRegion.Where(r => r.Id == x.PricingRegionId.Value).Select(r => r.Code).FirstOrDefault() : null,
            Priority = x.Priority,
            StartDate = x.StartDate,
            EndDate = x.EndDate,
            IsActive = x.IsActive
        });

    public void Add<T>(T entity) where T : class
        => _context.Set<T>().Add(entity);

    public void Remove<T>(T entity) where T : class
        => _context.Set<T>().Remove(entity);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
