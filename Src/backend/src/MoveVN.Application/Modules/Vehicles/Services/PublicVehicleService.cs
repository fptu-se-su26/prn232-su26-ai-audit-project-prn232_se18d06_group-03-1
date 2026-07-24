using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Vehicles.Services;

public class PublicVehicleService : IPublicVehicleService
{
    private readonly IVehicleCatalogRepository _repository;
    private readonly IUserRepository _userRepository;

    public PublicVehicleService(
        IVehicleCatalogRepository repository,
        IUserRepository userRepository)
    {
        _repository = repository;
        _userRepository = userRepository;
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
        var vehicle = await _repository.GetVehicleWithDetailsByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        if (vehicle.Status != VehicleStatus.Approved)
            throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);

        var features = await _repository.GetVehicleFeatureResponsesAsync(vehicle.Id, cancellationToken);

        var images = await _repository.GetVehicleImageResponsesAsync(vehicle.Id, cancellationToken);
        var feeRule = await _repository.GetActivePlatformFeeRuleAsync(vehicle.OwnerId, DateTime.UtcNow, cancellationToken);

        return new VehicleResponse
        {
            Id = vehicle.Id,
            OwnerId = vehicle.OwnerId,
            OwnerName = vehicle.Owner?.FullName ?? "",
            BrandId = vehicle.BrandId,
            BrandName = vehicle.Brand?.Name ?? "",
            ModelId = vehicle.ModelId,
            ModelName = vehicle.Model?.Name ?? "",
            VariantId = vehicle.VariantId,
            VariantName = vehicle.Variant?.Name,
            VehicleType = vehicle.VehicleType,
            Year = vehicle.Year,
            LicensePlate = vehicle.LicensePlate,
            OdometerKm = vehicle.OdometerKm,
            Description = vehicle.Description,
            Address = vehicle.Address,
            AreaId = vehicle.AreaId,
            Latitude = vehicle.Latitude,
            Longitude = vehicle.Longitude,
            AreaName = vehicle.Area is not null ? $"{vehicle.Area.Province} - {vehicle.Area.District}" : null,
            PricingRegionId = vehicle.Area?.PricingRegionId,
            PricingRegionCode = vehicle.Area?.PricingRegion?.Code,
            PricePerDay = vehicle.PricePerDay,
            DepositPercent = vehicle.DepositPercent,
            SecurityRequiresDeposit = vehicle.SecurityRequiresDeposit,
            SecurityDepositAmount = vehicle.SecurityDepositAmount,
            PricingMode = vehicle.Pricing?.PricingMode,
            FixedPricePerDay = vehicle.Pricing?.FixedPricePerDay,
            AutoMinPrice = vehicle.Pricing?.AutoMinPrice,
            AutoMaxPrice = vehicle.Pricing?.AutoMaxPrice,
            CurrentPricePerDay = vehicle.Pricing?.CurrentPricePerDay,
            Status = vehicle.Status,
            FeaturedImage = images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl,
            Images = images,
            Features = features,
PlatformFeeType = feeRule?.FeeType,
            PlatformFeeValue = feeRule?.FeeValue,
            PlatformFeeMinFee = feeRule?.MinFee,
            PlatformFeeMaxFee = feeRule?.MaxFee,
            BusyPeriods = [],
            CreatedAt = vehicle.CreatedAt,
        };
    }

    public async Task<List<VehicleImageResponse>> GetVehicleImagesAsync(long vehicleId, CancellationToken cancellationToken = default)
        => await _repository.GetVehicleImageResponsesAsync(vehicleId, cancellationToken);
}
