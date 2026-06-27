using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class VehicleService : IVehicleService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IPricingCalculatorService _pricingCalculator;

    public VehicleService(IVehicleCatalogRepository repository, IPricingCalculatorService pricingCalculator)
    {
        _repository = repository;
        _pricingCalculator = pricingCalculator;
    }

    public async Task<PagedResult<VehicleListItemResponse>> GetMyVehiclesAsync(
        long ownerId, string? type, string? keyword, string? sortBy, int page, int pageSize,
        int? brandId, int? modelId, string? status,
        string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity,
        CancellationToken cancellationToken = default)
    {
        var query = _repository.Vehicles
            .Where(v => v.OwnerId == ownerId);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(v => v.VehicleType == type);

        if (brandId.HasValue)
            query = query.Where(v => v.BrandId == brandId.Value);

        if (modelId.HasValue)
            query = query.Where(v => v.ModelId == modelId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(v => v.Status == status);

        if (!string.IsNullOrWhiteSpace(fuelType))
            query = query.Where(v => v.VariantId != null && _repository.VehicleModelVariants.Any(var => var.Id == v.VariantId && var.FuelType == fuelType));

        if (!string.IsNullOrWhiteSpace(seatCount) && byte.TryParse(seatCount, out var seatVal))
            query = query.Where(v => v.VariantId != null && _repository.VehicleModelVariants.Any(var => var.Id == v.VariantId && var.SeatCount == seatVal));

        if (!string.IsNullOrWhiteSpace(transmission))
            query = query.Where(v => v.VariantId != null && _repository.VehicleModelVariants.Any(var => var.Id == v.VariantId && var.Transmission == transmission));

        if (!string.IsNullOrWhiteSpace(bodyType))
            query = query.Where(v => v.VariantId != null && _repository.VehicleModelVariants.Any(var => var.Id == v.VariantId && var.BodyType == bodyType));

        if (!string.IsNullOrWhiteSpace(bikeType))
            query = query.Where(v => v.VariantId != null && _repository.VehicleModelVariants.Any(var => var.Id == v.VariantId && var.BikeType == bikeType));

        if (!string.IsNullOrWhiteSpace(engineCapacity))
            query = query.Where(v => v.VariantId != null && _repository.VehicleModelVariants.Any(var => var.Id == v.VariantId && var.EngineCapacity == engineCapacity));

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

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VehicleListItemResponse
            {
                Id = v.Id,
                BrandName = _repository.VehicleBrands.Where(b => b.Id == v.BrandId).Select(b => b.Name).FirstOrDefault() ?? "",
                ModelName = _repository.VehicleModels.Where(m => m.Id == v.ModelId).Select(m => m.Name).FirstOrDefault() ?? "",
                VariantName = v.VariantId != null ? _repository.VehicleModelVariants.Where(var => var.Id == v.VariantId).Select(var => var.Name).FirstOrDefault() : null,
                VehicleType = v.VehicleType,
                Year = v.Year,
                LicensePlate = v.LicensePlate,
                PricePerDay = v.PricePerDay,
                AreaName = v.AreaId.HasValue ? _repository.Areas.Where(a => a.Id == v.AreaId.Value).Select(a => a.Province + " - " + a.District).FirstOrDefault() : null,
                PricingMode = _repository.VehiclePricings.Where(p => p.VehicleId == v.Id).Select(p => p.PricingMode).FirstOrDefault(),
                Status = v.Status,
                FeaturedImage = _repository.VehicleImages.Where(img => img.VehicleId == v.Id && img.IsPrimary).Select(img => img.ImageUrl).FirstOrDefault(),
                CreatedAt = v.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<VehicleListItemResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<VehicleResponse> GetByIdAsync(long id, long ownerId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.OwnerId == ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        var brand = await _repository.GetVehicleBrandByIdAsync(vehicle.BrandId, cancellationToken);
        var model = await _repository.GetVehicleModelByIdAsync(vehicle.ModelId, cancellationToken);
        var variant = vehicle.VariantId.HasValue
            ? await _repository.GetVehicleModelVariantByIdAsync(vehicle.VariantId.Value, cancellationToken)
            : null;
        var area = vehicle.AreaId.HasValue
            ? await _repository.GetAreaByIdAsync(vehicle.AreaId.Value, cancellationToken)
            : null;
        var region = area is not null
            ? await _repository.GetPricingRegionByIdAsync(area.PricingRegionId, cancellationToken)
            : null;
        var pricing = await _repository.GetVehiclePricingByVehicleIdAsync(vehicle.Id, cancellationToken);
        PricingSuggestionResponse? suggestion = null;
        if (vehicle.AreaId.HasValue)
        {
            suggestion = await _pricingCalculator.GetSuggestionAsync(vehicle.ModelId, vehicle.AreaId.Value, cancellationToken);
        }

        var images = await _repository.VehicleImages
            .Where(img => img.VehicleId == vehicle.Id)
            .OrderBy(img => img.SortOrder)
            .Select(img => new VehicleImageResponse
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                IsPrimary = img.IsPrimary,
                SortOrder = img.SortOrder,
            })
            .ToListAsync(cancellationToken);

        var featureMappings = await _repository.VehicleFeatureMappings
            .Where(fm => fm.VehicleId == vehicle.Id)
            .ToListAsync(cancellationToken);

        var featureIds = featureMappings.Select(fm => fm.FeatureId).ToList();
        var features = await _repository.VehicleFeatures
            .Where(f => featureIds.Contains(f.Id))
            .Select(f => new VehicleFeatureResponse { Id = f.Id, Name = f.Name })
            .ToListAsync(cancellationToken);

        return new VehicleResponse
        {
            Id = vehicle.Id,
            OwnerId = vehicle.OwnerId,
            BrandId = vehicle.BrandId,
            BrandName = brand?.Name ?? "",
            ModelId = vehicle.ModelId,
            ModelName = model?.Name ?? "",
            VariantId = vehicle.VariantId,
            VariantName = variant?.Name,
            VehicleType = vehicle.VehicleType,
            Year = vehicle.Year,
            LicensePlate = vehicle.LicensePlate,
            OdometerKm = vehicle.OdometerKm,
            Description = vehicle.Description,
            Address = vehicle.Address,
            AreaId = vehicle.AreaId,
            AreaName = area is not null ? $"{area.Province} - {area.District}" : null,
            PricingRegionId = area?.PricingRegionId,
            PricingRegionCode = region?.Code,
            PricePerDay = vehicle.PricePerDay,
            PricingMode = pricing?.PricingMode,
            FixedPricePerDay = pricing?.FixedPricePerDay,
            AutoMinPrice = pricing?.AutoMinPrice,
            AutoMaxPrice = pricing?.AutoMaxPrice,
            CurrentPricePerDay = pricing?.CurrentPricePerDay,
            SuggestedBasePrice = suggestion?.BasePrice,
            SuggestedMinPrice = suggestion?.SuggestedMinPrice,
            SuggestedMaxPrice = suggestion?.SuggestedMaxPrice,
            Status = vehicle.Status,
            RejectionReason = vehicle.RejectionReason,
            FeaturedImage = images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl,
            Images = images,
            Features = features,
            CreatedAt = vehicle.CreatedAt,
        };
    }

    public async Task<VehicleResponse> CreateAsync(long ownerId, CreateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var brand = await _repository.GetVehicleBrandByIdAsync(request.BrandId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        var model = await _repository.GetVehicleModelByIdAsync(request.ModelId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        if (!model.IsActive || !brand.IsActive)
            throw new AppException(ErrorCode.VEHICLE_MODEL_INACTIVE);

        if (NormalizeVehicleType(brand.VehicleType) != NormalizeVehicleType(request.VehicleType))
            throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        if (request.AreaId.HasValue)
        {
            var area = await _repository.GetAreaByIdAsync(request.AreaId.Value, cancellationToken)
                ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);
            if (!area.IsActive)
                throw new AppException(ErrorCode.AREA_NOT_FOUND);
        }

        if (request.VariantId.HasValue)
        {
            var variant = await _repository.GetVehicleModelVariantByIdAsync(request.VariantId.Value, cancellationToken)
                ?? throw new AppException(ErrorCode.VEHICLE_MODEL_VARIANT_NOT_FOUND);
            if (variant.ModelId != request.ModelId || NormalizeVehicleType(variant.VehicleType) != NormalizeVehicleType(request.VehicleType))
                throw new AppException(ErrorCode.VEHICLE_MODEL_VARIANT_NOT_FOUND);
        }

        await ValidateFeaturesAsync(request.FeatureIds, request.VehicleType, cancellationToken);

        var pricingRequest = BuildPricingRequest(request);
        var vehicleForValidation = new Vehicle
        {
            ModelId = request.ModelId,
            AreaId = request.AreaId
        };
        await _pricingCalculator.ValidatePricingAsync(vehicleForValidation, pricingRequest, cancellationToken);
        var currentPrice = await _pricingCalculator.CalculateCurrentPriceAsync(vehicleForValidation, pricingRequest, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);

        var vehicle = new Vehicle
        {
            OwnerId = ownerId,
            BrandId = request.BrandId,
            ModelId = request.ModelId,
            VariantId = request.VariantId,
            VehicleType = request.VehicleType,
            Year = request.Year,
            LicensePlate = request.LicensePlate,
            OdometerKm = request.OdometerKm,
            Description = request.Description,
            Address = request.Address,
            AreaId = request.AreaId,
            PricePerDay = currentPrice,
            Status = VehicleStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        _repository.Add(vehicle);
        await _repository.SaveChangesAsync(cancellationToken);

        if (request.FeatureIds.Count != 0)
        {
            foreach (var featureId in request.FeatureIds)
            {
                _repository.Add(new VehicleFeatureMapping { VehicleId = vehicle.Id, FeatureId = featureId });
            }
            await _repository.SaveChangesAsync(cancellationToken);
        }

        if (request.ImageUrls.Count != 0)
        {
            for (var i = 0; i < request.ImageUrls.Count; i++)
            {
                _repository.Add(new VehicleImage
                {
                    VehicleId = vehicle.Id,
                    ImageUrl = request.ImageUrls[i],
                    IsPrimary = request.FeaturedImageIndex == i,
                    SortOrder = (byte)i,
                });
            }
            await _repository.SaveChangesAsync(cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(request.DocumentFileUrl))
        {
            _repository.Add(new VehicleDocument
            {
                VehicleId = vehicle.Id,
                DocType = "Registration",
                FileUrl = request.DocumentFileUrl,
            });
            await _repository.SaveChangesAsync(cancellationToken);
        }

        _repository.Add(new VehiclePricing
        {
            VehicleId = vehicle.Id,
            PricingMode = pricingRequest.PricingMode,
            FixedPricePerDay = pricingRequest.PricingMode == PricingModes.Fixed ? pricingRequest.FixedPricePerDay : null,
            AutoMinPrice = pricingRequest.PricingMode == PricingModes.Auto ? pricingRequest.AutoMinPrice : null,
            AutoMaxPrice = pricingRequest.PricingMode == PricingModes.Auto ? pricingRequest.AutoMaxPrice : null,
            CurrentPricePerDay = currentPrice,
            LastCalculatedAt = pricingRequest.PricingMode == PricingModes.Auto ? DateTime.UtcNow : null,
            LastUpdatedAt = DateTime.UtcNow
        });
        await _repository.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(vehicle.Id, ownerId, cancellationToken);
    }

    public async Task<VehicleResponse> UpdateAsync(long id, long ownerId, UpdateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.OwnerId == ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        vehicle.Year = request.Year;
        vehicle.LicensePlate = request.LicensePlate;
        vehicle.OdometerKm = request.OdometerKm;
        vehicle.Description = request.Description;
        vehicle.Address = request.Address;
        vehicle.AreaId = request.AreaId;

        if (request.AreaId.HasValue)
        {
            var area = await _repository.GetAreaByIdAsync(request.AreaId.Value, cancellationToken)
                ?? throw new AppException(ErrorCode.AREA_NOT_FOUND);
            if (!area.IsActive)
                throw new AppException(ErrorCode.AREA_NOT_FOUND);
        }

        await _repository.SaveChangesAsync(cancellationToken);

        await ValidateFeaturesAsync(request.FeatureIds, vehicle.VehicleType, cancellationToken);
        var existingMappings = await _repository.VehicleFeatureMappings
            .Where(fm => fm.VehicleId == vehicle.Id)
            .ToListAsync(cancellationToken);
        foreach (var mapping in existingMappings)
        {
            _repository.Remove(mapping);
        }

        foreach (var featureId in request.FeatureIds)
        {
            _repository.Add(new VehicleFeatureMapping { VehicleId = vehicle.Id, FeatureId = featureId });
        }
        await _repository.SaveChangesAsync(cancellationToken);

        var pricing = await _repository.GetVehiclePricingByVehicleIdAsync(vehicle.Id, cancellationToken);
        if (pricing is not null)
        {
            var pricingRequest = new UpdateVehiclePricingRequest
            {
                PricingMode = string.IsNullOrWhiteSpace(pricing.PricingMode) ? PricingModes.Fixed : pricing.PricingMode,
                FixedPricePerDay = pricing.FixedPricePerDay,
                AutoMinPrice = pricing.AutoMinPrice,
                AutoMaxPrice = pricing.AutoMaxPrice
            };
            await _pricingCalculator.ValidatePricingAsync(vehicle, pricingRequest, cancellationToken);
            pricing.CurrentPricePerDay = await _pricingCalculator.CalculateCurrentPriceAsync(vehicle, pricingRequest, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            pricing.LastUpdatedAt = DateTime.UtcNow;
            vehicle.PricePerDay = pricing.CurrentPricePerDay;
            await _repository.SaveChangesAsync(cancellationToken);
        }

        return await GetByIdAsync(vehicle.Id, ownerId, cancellationToken);
    }

    public async Task ToggleStatusAsync(long id, long ownerId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.OwnerId == ownerId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        vehicle.Status = vehicle.Status switch
        {
            VehicleStatus.Approved => VehicleStatus.Hidden,
            VehicleStatus.Hidden => VehicleStatus.Approved,
            _ => throw new AppException(ErrorCode.VEHICLE_TOGGLE_INVALID)
        };

        await _repository.SaveChangesAsync(cancellationToken);
    }

    private static UpdateVehiclePricingRequest BuildPricingRequest(CreateVehicleRequest request)
    {
        var pricingMode = string.IsNullOrWhiteSpace(request.PricingMode) ? PricingModes.Fixed : request.PricingMode.Trim();
        return new UpdateVehiclePricingRequest
        {
            PricingMode = pricingMode,
            FixedPricePerDay = pricingMode == PricingModes.Fixed ? request.FixedPricePerDay ?? request.PricePerDay : null,
            AutoMinPrice = pricingMode == PricingModes.Auto ? request.AutoMinPrice : null,
            AutoMaxPrice = pricingMode == PricingModes.Auto ? request.AutoMaxPrice : null
        };
    }

    private async Task ValidateFeaturesAsync(IEnumerable<int> featureIds, string vehicleType, CancellationToken cancellationToken)
    {
        var requestedIds = featureIds.ToList();
        var ids = requestedIds.Distinct().ToList();
        if (ids.Count == 0)
            return;

        if (ids.Count != requestedIds.Count)
            throw new AppException(ErrorCode.VEHICLE_FEATURE_NOT_FOUND);

        var normalizedVehicleType = NormalizeVehicleType(vehicleType);
        var query = _repository.VehicleFeatures.Where(f => ids.Contains(f.Id) && f.IsActive);
        query = normalizedVehicleType == "Motorbike"
            ? query.Where(f => f.VehicleType == "Motorbike" || f.VehicleType == "Motorcycle")
            : query.Where(f => f.VehicleType == normalizedVehicleType);

        var count = await query.CountAsync(cancellationToken);

        if (count != ids.Count)
            throw new AppException(ErrorCode.VEHICLE_FEATURE_NOT_FOUND);
    }

    private static string NormalizeVehicleType(string value)
        => value.Equals("Motorcycle", StringComparison.OrdinalIgnoreCase) ? "Motorbike" : value;
}
