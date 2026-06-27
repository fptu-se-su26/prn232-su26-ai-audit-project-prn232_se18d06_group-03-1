using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;

namespace MoveVN.Api.Controllers.Vehicles;

[Authorize]
[ApiController]
[Route("api/catalog")]
public class VehicleCatalogController : ControllerBase
{
    private readonly IVehicleCatalogRepository _repository;

    public VehicleCatalogController(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("brands")]
    public async Task<ActionResult> GetBrands([FromQuery] string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleBrands.Where(b => b.IsActive);
        if (!string.IsNullOrWhiteSpace(vehicleType))
            query = query.Where(b => b.VehicleType == vehicleType);

        var result = await query
            .OrderBy(b => b.Name)
            .Select(b => new { b.Id, b.Name, b.VehicleType })
            .ToListAsync(cancellationToken);

        return Ok(result);
    }

    [HttpGet("models")]
    public async Task<ActionResult> GetModels([FromQuery] int? brandId, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleModels.Where(m => m.IsActive);
        if (brandId.HasValue)
            query = query.Where(m => m.BrandId == brandId.Value);

        var result = await query
            .OrderBy(m => m.Name)
            .Select(m => new { m.Id, m.BrandId, m.Name })
            .ToListAsync(cancellationToken);

        return Ok(result);
    }

    [HttpGet("variants")]
    public async Task<ActionResult> GetVariants([FromQuery] int? modelId, [FromQuery] string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleModelVariants.Where(v => v.IsActive);
        if (modelId.HasValue)
            query = query.Where(v => v.ModelId == modelId.Value);
        if (!string.IsNullOrWhiteSpace(vehicleType))
            query = query.Where(v => v.VehicleType == vehicleType);

        var result = await query
            .OrderBy(v => v.Name)
            .Select(v => new { v.Id, v.ModelId, v.Name, v.VehicleType, v.SeatCount, v.Transmission, v.FuelType, v.BodyType, v.BikeType, v.EngineCapacity })
            .ToListAsync(cancellationToken);

        return Ok(result);
    }

    [HttpGet("features")]
    public async Task<ActionResult> GetFeatures([FromQuery] string? vehicleType, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleFeatures.Where(f => f.IsActive);
        if (!string.IsNullOrWhiteSpace(vehicleType))
            query = query.Where(f => f.VehicleType == vehicleType);

        var result = await query
            .OrderBy(f => f.Name)
            .Select(f => new { f.Id, f.Name, f.VehicleType })
            .ToListAsync(cancellationToken);

        return Ok(result);
    }
}
