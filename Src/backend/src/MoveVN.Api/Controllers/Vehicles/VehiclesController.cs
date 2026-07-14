using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.VehiclePricings.DTOs;
using MoveVN.Application.Modules.VehiclePricings.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Api.Controllers.Vehicles;

[Authorize(Roles = "Owner")]
[Route("api/vehicles")]
public class VehiclesController : BaseApiController
{
    private readonly IVehicleService _vehicleService;
    private readonly IVehiclePricingService _vehiclePricingService;
    private readonly ICurrentUserContext _currentUser;
    private readonly IBlockedDateService _blockedDateService;

    public VehiclesController(IVehicleService vehicleService, IVehiclePricingService vehiclePricingService, ICurrentUserContext currentUser, IBlockedDateService blockedDateService)
    {
        _vehicleService = vehicleService;
        _vehiclePricingService = vehiclePricingService;
        _currentUser = currentUser;
        _blockedDateService = blockedDateService;
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

    [HttpGet("pricing/suggestion")]
    public async Task<ActionResult<ApiResponse<PricingSuggestionResponse>>> GetPricingSuggestion(
        [FromQuery] int modelId,
        [FromQuery] int areaId,
        [FromQuery] DateOnly? date,
        [FromQuery] decimal? vacantRate,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehiclePricingService.GetSuggestionAsync(modelId, areaId, date, vacantRate, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}/pricing")]
    public async Task<ActionResult<ApiResponse<VehiclePricingResponse>>> GetPricing(long id, CancellationToken cancellationToken = default)
    {
        var result = await _vehiclePricingService.GetByVehicleIdAsync(id, _currentUser.UserId!.Value, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id}/pricing")]
    public async Task<ActionResult<ApiResponse<VehiclePricingResponse>>> UpdatePricing(long id, [FromBody] UpdateVehiclePricingRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehiclePricingService.UpdateAsync(id, _currentUser.UserId!.Value, request, cancellationToken);
        return Success(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> Create([FromBody] CreateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.CreateAsync(_currentUser.UserId!.Value, request, cancellationToken);
        return Success(result);
    }

    [HttpPost("images")]
    public async Task<ActionResult<ApiResponse<object>>> UploadImage(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<object>.Failed("VEHICLE_9005", "Vehicle image file is required."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(ApiResponse<object>.Failed("VEHICLE_9005", "Only JPG, PNG, or WebP vehicle images are allowed."));
        }

        const int maxSize = 10 * 1024 * 1024;
        if (file.Length > maxSize)
        {
            return BadRequest(ApiResponse<object>.Failed("VEHICLE_9005", "Vehicle image must be under 10MB."));
        }

        await using var stream = file.OpenReadStream();
        var url = await _vehicleService.UploadImageAsync(_currentUser.UserId!.Value, stream, file.FileName, cancellationToken);
        return Success<object>(new { url });
    }

    [HttpPost("{id}/documents")]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> UploadDocument(
        long id,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<VehicleResponse>.Failed("VEHICLE_9003", "Vehicle document file is required."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(ApiResponse<VehicleResponse>.Failed("VEHICLE_9003", "Only JPG, PNG, or WebP vehicle document images are allowed."));
        }

        const int maxSize = 10 * 1024 * 1024;
        if (file.Length > maxSize)
        {
            return BadRequest(ApiResponse<VehicleResponse>.Failed("VEHICLE_9003", "Vehicle document image must be under 10MB."));
        }

        await using var stream = file.OpenReadStream();
        var result = await _vehicleService.UploadDocumentAsync(id, _currentUser.UserId!.Value, stream, file.FileName, cancellationToken);
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

    [HttpPost("{id}/blocked-dates")]
    public async Task<ActionResult<ApiResponse<BlockedDateResponse>>> CreateBlockedDate(
        long id,
        [FromBody] BlockedDateRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await _blockedDateService.CreateAsync(id, _currentUser.UserId!.Value, request, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}/blocked-dates")]
    public async Task<ActionResult<ApiResponse<List<BlockedDateResponse>>>> GetBlockedDates(
        long id,
        CancellationToken cancellationToken = default)
    {
        var result = await _blockedDateService.GetByVehicleAsync(id, _currentUser.UserId!.Value, cancellationToken);
        return Success(result);
    }

    [HttpDelete("blocked-dates/{blockedDateId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteBlockedDate(
        long blockedDateId,
        CancellationToken cancellationToken = default)
    {
        await _blockedDateService.DeleteAsync(blockedDateId, _currentUser.UserId!.Value, cancellationToken);
        return Success(new object());
    }
}
