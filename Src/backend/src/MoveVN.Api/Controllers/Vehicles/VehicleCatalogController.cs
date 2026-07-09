using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenseClasses.DTOs;
using MoveVN.Application.Modules.DriverLicenseClasses.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Api.Controllers.Vehicles;

[AllowAnonymous]
[Route("api/catalog")]
public class VehicleCatalogController : BaseApiController
{
    private readonly IVehicleCatalogService _vehicleCatalogService;
    private readonly IDriverLicenseClassService _driverLicenseClassService;

    public VehicleCatalogController(
        IVehicleCatalogService vehicleCatalogService,
        IDriverLicenseClassService driverLicenseClassService)
    {
        _vehicleCatalogService = vehicleCatalogService;
        _driverLicenseClassService = driverLicenseClassService;
    }

    [HttpGet("brands")]
    public async Task<ActionResult<ApiResponse<List<CatalogBrandResponse>>>> GetBrands([FromQuery] string? vehicleType, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleCatalogService.GetBrandsAsync(vehicleType, cancellationToken);
        return Success(result);
    }

    [HttpGet("models")]
    public async Task<ActionResult<ApiResponse<List<CatalogModelResponse>>>> GetModels([FromQuery] int? brandId, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleCatalogService.GetModelsAsync(brandId, cancellationToken);
        return Success(result);
    }

    [HttpGet("variants")]
    public async Task<ActionResult<ApiResponse<List<CatalogVariantResponse>>>> GetVariants([FromQuery] int? modelId, [FromQuery] string? vehicleType, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleCatalogService.GetVariantsAsync(modelId, vehicleType, cancellationToken);
        return Success(result);
    }

    [HttpGet("features")]
    public async Task<ActionResult<ApiResponse<List<CatalogFeatureResponse>>>> GetFeatures([FromQuery] string? vehicleType, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleCatalogService.GetFeaturesAsync(vehicleType, cancellationToken);
        return Success(result);
    }

    [HttpGet("areas")]
    public async Task<ActionResult<ApiResponse<List<CatalogAreaResponse>>>> GetAreas(
        [FromQuery] string? province,
        [FromQuery] int? pricingRegionId,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleCatalogService.GetAreasAsync(province, pricingRegionId, cancellationToken);
        return Success(result);
    }

    [HttpGet("pricing-regions")]
    public async Task<ActionResult<ApiResponse<List<CatalogPricingRegionResponse>>>> GetPricingRegions(CancellationToken cancellationToken = default)
    {
        var result = await _vehicleCatalogService.GetPricingRegionsAsync(cancellationToken);
        return Success(result);
    }

    [HttpGet("driver-license-classes")]
    public async Task<ActionResult<ApiResponse<List<DriverLicenseClassResponse>>>> GetDriverLicenseClasses(CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseClassService.GetAllAsync(null, "code_asc", null, 1, 100, cancellationToken);
        return Success(result.Items);
    }

    [HttpGet("driver-license-classes/{id}/compatible-required-classes")]
    public async Task<ActionResult<ApiResponse<List<DriverLicenseClassResponse>>>> GetCompatibleDriverLicenseClasses(int id, CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseClassService.GetCompatibleRequiredClassesAsync(id, cancellationToken);
        return Success(result);
    }
}
