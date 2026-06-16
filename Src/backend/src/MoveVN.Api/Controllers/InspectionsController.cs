using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/inspections")]
public class InspectionsController : BaseApiController
{
    private readonly IInspectionService _inspectionService;
    private readonly ICurrentUserContext _currentUser;

    public InspectionsController(IInspectionService inspectionService, ICurrentUserContext currentUser)
    {
        _inspectionService = inspectionService;
        _currentUser = currentUser;
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPost("check-in")]
    public async Task<ActionResult<ApiResponse<InspectionResponse>>> CheckIn(
        [FromForm] CreateInspectionRequest request,
        IList<IFormFile>? images,
        CancellationToken cancellationToken)
    {
        request.Type = "CheckIn";
        var staffId = _currentUser.DomainUserId!.Value;
        var result = await _inspectionService.CreateAsync(request, staffId, images, cancellationToken);
        return Ok(ApiResponse<InspectionResponse>.Succeeded(result, "Check-in inspection created."));
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPost("check-out")]
    public async Task<ActionResult<ApiResponse<InspectionResponse>>> CheckOut(
        [FromForm] CreateInspectionRequest request,
        IList<IFormFile>? images,
        CancellationToken cancellationToken)
    {
        request.Type = "CheckOut";
        var staffId = _currentUser.DomainUserId!.Value;
        var result = await _inspectionService.CreateAsync(request, staffId, images, cancellationToken);
        return Ok(ApiResponse<InspectionResponse>.Succeeded(result, "Check-out inspection created."));
    }

    [HttpGet("booking/{bookingId:long}/{type}")]
    public async Task<ActionResult<ApiResponse<InspectionResponse>>> GetByBookingAndType(
        long bookingId,
        string type,
        CancellationToken cancellationToken)
    {
        var result = await _inspectionService.GetByBookingAndTypeAsync(bookingId, type, cancellationToken);
        if (result is null)
            return NotFound(ApiResponse<InspectionResponse>.Failed("Inspection not found."));
        return Ok(ApiResponse<InspectionResponse>.Succeeded(result));
    }
}
