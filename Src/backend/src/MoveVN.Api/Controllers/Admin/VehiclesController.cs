using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/vehicles")]
public class VehiclesController : BaseApiController
{
    private readonly IVehicleModerationService _vehicleModerationService;

    public VehiclesController(IVehicleModerationService vehicleModerationService)
    {
        _vehicleModerationService = vehicleModerationService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleModerationListItem>>>> GetVehicles(
        [FromQuery] string? status,
        [FromQuery] string? documentStatus,
        [FromQuery] string? keyword,
        [FromQuery] string? vehicleType,
        [FromQuery] int? brandId,
        [FromQuery] int? modelId,
        [FromQuery] string? fuelType,
        [FromQuery] string? seatCount,
        [FromQuery] string? transmission,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModerationService.GetVehiclesAsync(status, documentStatus, keyword, vehicleType, brandId, modelId, fuelType, seatCount, transmission, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("moderation-overview")]
    public async Task<ActionResult<ApiResponse<VehicleModerationOverviewResponse>>> GetModerationOverview(CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModerationService.GetOverviewAsync(cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleModerationDetailResponse>>> GetById(long id, CancellationToken cancellationToken = default)
    {
        var result = await _vehicleModerationService.GetByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost("{id}/documents/{documentId}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveDocument(long id, long documentId, CancellationToken cancellationToken = default)
    {
        await _vehicleModerationService.ApproveDocumentAsync(id, documentId, cancellationToken);
        return Success<object>(null, "Vehicle document approved.");
    }

    [HttpPost("{id}/documents/{documentId}/reject")]
    public async Task<ActionResult<ApiResponse<object>>> RejectDocument(long id, long documentId, VehicleModerationActionRequest request, CancellationToken cancellationToken = default)
    {
        await _vehicleModerationService.RejectDocumentAsync(id, documentId, request.Reason, cancellationToken);
        return Success<object>(null, "Vehicle document rejected.");
    }

    [HttpPost("{id}/documents/{documentId}/request-more-info")]
    public async Task<ActionResult<ApiResponse<object>>> RequestMoreInfo(long id, long documentId, VehicleModerationActionRequest request, CancellationToken cancellationToken = default)
    {
        await _vehicleModerationService.RequestMoreInfoAsync(id, documentId, request.Reason, cancellationToken);
        return Success<object>(null, "Requested more vehicle document information.");
    }

    [HttpPost("{id}/approve-listing")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveListing(long id, CancellationToken cancellationToken = default)
    {
        await _vehicleModerationService.ApproveListingAsync(id, allowOverride: true, cancellationToken);
        return Success<object>(null, "Vehicle listing approved.");
    }

    [HttpPost("{id}/reject-listing")]
    public async Task<ActionResult<ApiResponse<object>>> RejectListing(long id, VehicleModerationActionRequest request, CancellationToken cancellationToken = default)
    {
        await _vehicleModerationService.RejectListingAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Vehicle listing rejected.");
    }
}
