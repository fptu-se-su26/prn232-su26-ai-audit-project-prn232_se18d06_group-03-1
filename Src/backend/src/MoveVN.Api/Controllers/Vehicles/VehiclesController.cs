using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Api.Controllers.Vehicles;

[Authorize(Roles = "Owner")]
[Route("api/vehicles")]
public class VehiclesController : BaseApiController
{
    private readonly IVehicleService _vehicleService;
    private readonly ICurrentUserContext _currentUser;

    public VehiclesController(IVehicleService vehicleService, ICurrentUserContext currentUser)
    {
        _vehicleService = vehicleService;
        _currentUser = currentUser;
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleListItemResponse>>>> GetMyVehicles(
        [FromQuery] string? type,
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] int? brandId,
        [FromQuery] int? modelId,
        [FromQuery] string? status,
        [FromQuery] string? fuelType,
        [FromQuery] string? seatCount,
        [FromQuery] string? transmission,
        [FromQuery] string? bodyType,
        [FromQuery] string? bikeType,
        [FromQuery] string? engineCapacity,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.GetMyVehiclesAsync(_currentUser.UserId!.Value, type, keyword, sortBy, page, pageSize, brandId, modelId, status, fuelType, seatCount, transmission, bodyType, bikeType, engineCapacity, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> GetById(long id, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.GetByIdAsync(id, _currentUser.UserId!.Value, cancellationToken);
        return Success(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> Create([FromBody] CreateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.CreateAsync(_currentUser.UserId!.Value, request, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> Update(long id, [FromBody] UpdateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.UpdateAsync(id, _currentUser.UserId!.Value, request, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<ActionResult<ApiResponse<object>>> ToggleStatus(long id, CancellationToken cancellationToken = default)
    {
        await _vehicleService.ToggleStatusAsync(id, _currentUser.UserId!.Value, cancellationToken);
        return Success(new object());
    }
}
