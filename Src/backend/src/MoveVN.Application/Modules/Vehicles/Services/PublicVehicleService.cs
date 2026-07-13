using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class PublicVehicleService : IPublicVehicleService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IPricingCalculatorService _pricingCalculator;

    public PublicVehicleService(
        IVehicleCatalogRepository repository,
        IPricingCalculatorService pricingCalculator)
    {
        _repository = repository;
        _pricingCalculator = pricingCalculator;
    }

    public async Task<PagedResult<VehicleListItemResponse>> GetAvailableVehiclesAsync(
        string? type, string? keyword, string? sortBy, int page, int pageSize,
        int? brandId, int? modelId, string? fuelType, string? seatCount,
        string? transmission, string? bodyType, string? bikeType, string? engineCapacity,
        decimal? priceFrom = null, decimal? priceTo = null, string? featureIds = null,
        DateTime? searchStartDate = null, DateTime? searchEndDate = null,
        string? brandIds = null, string? transmissions = null, string? fuelTypes = null,
        string? bodyTypes = null, string? bikeTypes = null, int? areaId = null,
        CancellationToken cancellationToken = default)
        => await _repository.GetAvailableVehiclesAsync(type, keyword, sortBy, page, pageSize,
            brandId, modelId, fuelType, seatCount, transmission, bodyType, bikeType, engineCapacity,
            priceFrom, priceTo, featureIds, searchStartDate, searchEndDate,
            brandIds, transmissions, fuelTypes, bodyTypes, bikeTypes, areaId, cancellationToken);

    public async Task<VehicleResponse> GetVehicleDetailAsync(long id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _repository.GetVehicleByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        if (vehicle.Status != VehicleStatus.Approved)
            throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

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

        var images = await _repository.GetVehicleImageResponsesAsync(vehicle.Id, cancellationToken);
        var features = await _repository.GetVehicleFeatureResponsesAsync(vehicle.Id, cancellationToken);

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
            Latitude = vehicle.Latitude,
            Longitude = vehicle.Longitude,
            AreaName = area is not null ? $"{area.Province} - {area.District}" : null,
            PricingRegionId = area?.PricingRegionId,
            PricingRegionCode = region?.Code,
            PricePerDay = vehicle.PricePerDay,
            DepositPercent = vehicle.DepositPercent,
            PricingMode = pricing?.PricingMode,
            FixedPricePerDay = pricing?.FixedPricePerDay,
            AutoMinPrice = pricing?.AutoMinPrice,
            AutoMaxPrice = pricing?.AutoMaxPrice,
            CurrentPricePerDay = pricing?.CurrentPricePerDay,
            SuggestedBasePrice = suggestion?.BasePrice,
            SuggestedMinPrice = suggestion?.SuggestedMinPrice,
            SuggestedMaxPrice = suggestion?.SuggestedMaxPrice,
            Status = vehicle.Status,
            FeaturedImage = images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl,
            Images = images,
            Features = features,
            CreatedAt = vehicle.CreatedAt,
        };
    }
}
