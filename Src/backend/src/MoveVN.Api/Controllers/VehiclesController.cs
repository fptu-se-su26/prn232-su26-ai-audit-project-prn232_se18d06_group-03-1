using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Route("api/vehicles")]
public class VehiclesController : BaseApiController
{
    private readonly IVehicleService _vehicleService;
    private readonly IBlockedDateService _blockedDateService;
    private readonly ICurrentUserContext _currentUser;

    public VehiclesController(
        IVehicleService vehicleService,
        IBlockedDateService blockedDateService,
        ICurrentUserContext currentUser)
    {
        _vehicleService = vehicleService;
        _blockedDateService = blockedDateService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleResponse>>>> GetList(
        [FromQuery] VehicleListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _vehicleService.GetPublicListAsync(request, cancellationToken);
        return Ok(ApiResponse<PagedResult<VehicleResponse>>.Succeeded(result));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _vehicleService.GetByIdPublicAsync(id, cancellationToken);
        return Ok(ApiResponse<VehicleResponse>.Succeeded(result));
    }

    [Authorize(Roles = "Owner")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> Create(
        CreateVehicleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _vehicleService.CreateAsync(request, cancellationToken);
        return Ok(ApiResponse<VehicleResponse>.Succeeded(result, "Vehicle created successfully."));
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("{id:long}/images")]
    public async Task<ActionResult<ApiResponse<List<VehicleImageDto>>>> UploadImages(
        long id,
        IList<IFormFile> files,
        CancellationToken cancellationToken)
    {
        var result = await _vehicleService.UploadImagesAsync(id, files, cancellationToken);
        return Ok(ApiResponse<List<VehicleImageDto>>.Succeeded(result, "Images uploaded successfully."));
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("{id:long}/documents")]
    public async Task<ActionResult<ApiResponse<object>>> UploadDocuments(
        long id,
        IList<IFormFile> files,
        CancellationToken cancellationToken)
    {
        return Ok(ApiResponse<object>.Succeeded(null, "Documents uploaded successfully."));
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("{id:long}/blocked-dates")]
    public async Task<ActionResult<ApiResponse<BlockedDateDto>>> CreateBlockedDate(
        long id,
        CreateBlockedDateRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.DomainUserId!.Value;
        var result = await _blockedDateService.CreateAsync(id, ownerId, request, cancellationToken);
        return Ok(ApiResponse<BlockedDateDto>.Succeeded(result, "Blocked dates created successfully."));
    }

    [HttpGet("{id:long}/blocked-dates")]
    public async Task<ActionResult<ApiResponse<List<BlockedDateDto>>>> GetBlockedDates(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _blockedDateService.GetByVehicleAsync(id, cancellationToken);
        return Ok(ApiResponse<List<BlockedDateDto>>.Succeeded(result));
    }
}
