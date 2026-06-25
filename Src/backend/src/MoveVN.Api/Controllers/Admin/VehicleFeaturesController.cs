using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleFeatures.DTOs;
using MoveVN.Application.Modules.VehicleFeatures.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/vehicle-features")]
public class VehicleFeaturesController : BaseApiController
{
    private readonly IVehicleFeatureService _vehicleFeatureService;

    public VehicleFeaturesController(IVehicleFeatureService vehicleFeatureService)
    {
        _vehicleFeatureService = vehicleFeatureService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleFeatureResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] string? vehicleType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleFeatureService.GetAllAsync(keyword, sortBy, vehicleType, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleFeatureResponse>>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleFeatureService.GetByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleFeatureResponse>>> Create(CreateVehicleFeatureRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleFeatureService.CreateAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleFeatureResponse>>> Update(int id, UpdateVehicleFeatureRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleFeatureService.UpdateAsync(id, request, cancellationToken);
        return Success(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _vehicleFeatureService.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
