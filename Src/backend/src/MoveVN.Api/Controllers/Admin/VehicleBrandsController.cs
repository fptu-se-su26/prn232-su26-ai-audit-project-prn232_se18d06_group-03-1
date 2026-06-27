using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleBrands.DTOs;
using MoveVN.Application.Modules.VehicleBrands.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/vehicle-brands")]
public class VehicleBrandsController : BaseApiController
{
    private readonly IVehicleBrandService _vehicleBrandService;

    public VehicleBrandsController(IVehicleBrandService vehicleBrandService)
    {
        _vehicleBrandService = vehicleBrandService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleBrandResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] string? vehicleType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleBrandService.GetAllAsync(keyword, sortBy, vehicleType, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleBrandResponse>>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleBrandService.GetByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleBrandResponse>>> Create(CreateVehicleBrandRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleBrandService.CreateAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}/cascade-info")]
    public async Task<ActionResult<ApiResponse<BrandCascadeInfoResponse>>> GetCascadeInfo(int id, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleBrandService.GetCascadeInfoAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleBrandResponse>>> Update(int id, UpdateVehicleBrandRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleBrandService.UpdateAsync(id, request, cancellationToken);
        return Success(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _vehicleBrandService.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
