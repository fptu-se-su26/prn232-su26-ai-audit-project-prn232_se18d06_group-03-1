using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize(Policy = "staff.inspect")]
[Route("api/staff/vehicles")]
public class StaffVehiclesController : BaseApiController
{
    private readonly IVehicleService _vehicleService;
    private readonly ICurrentUserContext _currentUser;

    public StaffVehiclesController(IVehicleService vehicleService, ICurrentUserContext currentUser)
    {
        _vehicleService = vehicleService;
        _currentUser = currentUser;
    }

    [HttpGet("pending")]
    public async Task<ActionResult<ApiResponse<PagedResult<VehicleResponse>>>> GetPendingQueue(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.GetPendingQueueAsync(page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<VehicleResponse>>.Succeeded(result));
    }

    [HttpPut("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(
        long id,
        ApproveVehicleRequest request,
        CancellationToken cancellationToken)
    {
        var staffId = _currentUser.DomainUserId!.Value;
        await _vehicleService.ApproveAsync(id, staffId, request, cancellationToken);
        var message = request.Approve ? "Vehicle approved successfully." : "Vehicle rejected.";
        return Ok(ApiResponse<object>.Succeeded(null, message));
    }
}
