using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleModels.DTOs;
using MoveVN.Application.Modules.VehicleModels.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/vehicle-models")]
public class VehicleModelsController : BaseApiController
{
    private readonly IVehicleModelService _vehicleModelService;

    public VehicleModelsController(IVehicleModelService vehicleModelService)
    {
        _vehicleModelService = vehicleModelService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleModelResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] string? vehicleType,
        [FromQuery] int? brandId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelService.GetAllAsync(keyword, sortBy, vehicleType, brandId, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleModelResponse>>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelService.GetByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpGet("by-brand/{brandId}")]
    public async Task<ActionResult<ApiResponse<List<VehicleModelResponse>>>> GetByBrandId(int brandId, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelService.GetByBrandIdAsync(brandId, cancellationToken);
        return Success(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleModelResponse>>> Create(CreateVehicleModelRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelService.CreateAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}/cascade-info")]
    public async Task<ActionResult<ApiResponse<ModelCascadeInfoResponse>>> GetCascadeInfo(int id, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelService.GetCascadeInfoAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleModelResponse>>> Update(int id, UpdateVehicleModelRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelService.UpdateAsync(id, request, cancellationToken);
        return Success(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _vehicleModelService.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
