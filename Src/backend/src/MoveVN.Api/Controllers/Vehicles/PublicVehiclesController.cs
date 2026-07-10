using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Api.Controllers.Vehicles;

[AllowAnonymous]
[Route("api/public/vehicles")]
public class PublicVehiclesController : BaseApiController
{
    private readonly IPublicVehicleService _publicVehicleService;
    private readonly IVehicleCatalogRepository _vehicleCatalogRepository;

    public PublicVehiclesController(IPublicVehicleService publicVehicleService, IVehicleCatalogRepository vehicleCatalogRepository)
    {
        _publicVehicleService = publicVehicleService;
        _vehicleCatalogRepository = vehicleCatalogRepository;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleListItemResponse>>>> GetAvailableVehicles(
        [FromQuery] string? type,
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] int? brandId = null,
        [FromQuery] int? modelId = null,
        [FromQuery] string? fuelType = null,
        [FromQuery] string? seatCount = null,
        [FromQuery] string? transmission = null,
        [FromQuery] string? bodyType = null,
        [FromQuery] string? bikeType = null,
        [FromQuery] string? engineCapacity = null,
        [FromQuery] decimal? priceFrom = null,
        [FromQuery] decimal? priceTo = null,
        [FromQuery] string? featureIds = null,
        [FromQuery] DateTime? searchStartDate = null,
        [FromQuery] DateTime? searchEndDate = null,
        [FromQuery] string? brandIds = null,
        [FromQuery] string? transmissions = null,
        [FromQuery] string? fuelTypes = null,
        [FromQuery] string? bodyTypes = null,
        [FromQuery] string? bikeTypes = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _publicVehicleService.GetAvailableVehiclesAsync(
            type, keyword, sortBy, page, pageSize,
            brandId, modelId, fuelType, seatCount,
            transmission, bodyType, bikeType, engineCapacity,
            priceFrom, priceTo, featureIds, searchStartDate, searchEndDate,
            brandIds, transmissions, fuelTypes, bodyTypes, bikeTypes,
            cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}/availability")]
    public async Task<ActionResult<ApiResponse<VehicleAvailabilityResponse>>> GetAvailability(
        long id,
        CancellationToken cancellationToken = default)
    {
        var periods = await _vehicleCatalogRepository.GetVehicleBusyPeriodsAsync(id, cancellationToken);
        return Success(new VehicleAvailabilityResponse { VehicleId = id, BusyPeriods = periods });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> GetVehicleDetail(
        long id,
        CancellationToken cancellationToken = default)
    {
        var result = await _publicVehicleService.GetVehicleDetailAsync(id, cancellationToken);
        return Success(result);
    }
}