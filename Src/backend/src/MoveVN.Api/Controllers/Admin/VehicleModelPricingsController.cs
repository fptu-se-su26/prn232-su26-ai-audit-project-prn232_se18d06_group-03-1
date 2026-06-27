using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleModelPricings.DTOs;
using MoveVN.Application.Modules.VehicleModelPricings.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/vehicle-model-pricings")]
public class VehicleModelPricingsController : BaseApiController
{
    private readonly IVehicleModelPricingService _service;

    public VehicleModelPricingsController(IVehicleModelPricingService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleModelPricingResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] string? vehicleType,
        [FromQuery] int? brandId,
        [FromQuery] int? modelId,
        [FromQuery] int? pricingRegionId,
        [FromQuery] bool? isActive,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Success(await _service.GetAllAsync(keyword, sortBy, vehicleType, brandId, modelId, pricingRegionId, isActive, minPrice, maxPrice, page, pageSize, cancellationToken));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleModelPricingResponse>>> GetById(int id, CancellationToken cancellationToken = default)
        => Success(await _service.GetByIdAsync(id, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleModelPricingResponse>>> Create(CreateVehicleModelPricingRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.CreateAsync(request, cancellationToken));

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleModelPricingResponse>>> Update(int id, UpdateVehicleModelPricingRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
