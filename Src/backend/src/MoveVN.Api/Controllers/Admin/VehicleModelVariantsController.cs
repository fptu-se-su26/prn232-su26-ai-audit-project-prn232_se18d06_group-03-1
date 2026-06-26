using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleModelVariants.DTOs;
using MoveVN.Application.Modules.VehicleModelVariants.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/vehicle-model-variants")]
public class VehicleModelVariantsController : BaseApiController
{
    private readonly IVehicleModelVariantService _vehicleModelVariantService;

    public VehicleModelVariantsController(IVehicleModelVariantService vehicleModelVariantService)
    {
        _vehicleModelVariantService = vehicleModelVariantService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleModelVariantResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] string? vehicleType,
        [FromQuery] int? brandId,
        [FromQuery] int? modelId,
        [FromQuery] string? bodyType,
        [FromQuery] byte? seatCount,
        [FromQuery] string? transmission,
        [FromQuery] string? fuelType,
        [FromQuery] string? bikeType,
        [FromQuery] string? engineCapacity,
        [FromQuery] int? requiredLicenseClassId,
        [FromQuery] string? licenseSystemVersion,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelVariantService.GetAllAsync(keyword, sortBy, vehicleType, brandId, modelId, bodyType, seatCount, transmission, fuelType, bikeType, engineCapacity, requiredLicenseClassId, licenseSystemVersion, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleModelVariantResponse>>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelVariantService.GetByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleModelVariantResponse>>> Create(CreateVehicleModelVariantRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelVariantService.CreateAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleModelVariantResponse>>> Update(int id, UpdateVehicleModelVariantRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModelVariantService.UpdateAsync(id, request, cancellationToken);
        return Success(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _vehicleModelVariantService.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
