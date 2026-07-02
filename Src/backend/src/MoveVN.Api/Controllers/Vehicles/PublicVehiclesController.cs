using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Api.Controllers.Vehicles;

[AllowAnonymous]
[Route("api/public/vehicles")]
public class PublicVehiclesController : BaseApiController
{
    private readonly IPublicVehicleService _publicVehicleService;

    public PublicVehiclesController(IPublicVehicleService publicVehicleService)
    {
        _publicVehicleService = publicVehicleService;
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
        CancellationToken cancellationToken = default)
    {
        var result = await _publicVehicleService.GetAvailableVehiclesAsync(
            type, keyword, sortBy, page, pageSize,
            brandId, modelId, fuelType, seatCount,
            transmission, bodyType, bikeType, engineCapacity, cancellationToken);
        return Success(result);
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