using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Api.Controllers.Vehicles;

[Authorize]
[Route("api/catalog")]
public class VehicleCatalogController : BaseApiController
{
    private readonly IVehicleCatalogService _vehicleCatalogService;

    public VehicleCatalogController(IVehicleCatalogService vehicleCatalogService)
    {
        _vehicleCatalogService = vehicleCatalogService;
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
}
