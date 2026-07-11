using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenses.DTOs;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/driver-license-verifications")]
public class DriverLicenseVerificationsController : BaseApiController
{
    private readonly IDriverLicenseService _driverLicenseService;

    public DriverLicenseVerificationsController(IDriverLicenseService driverLicenseService)
    {
        _driverLicenseService = driverLicenseService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DriverLicenseVerificationListItem>>>> GetList(
        [FromQuery] string? status,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseService.GetVerificationsAsync(status, keyword, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<DriverLicenseVerificationRequestDto>>> GetById(long id, CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseService.GetVerificationByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(long id, [FromBody] DriverLicenseApproveRequest? request, CancellationToken cancellationToken = default)
    {
        await _driverLicenseService.ApproveAsync(id, request ?? new DriverLicenseApproveRequest(), cancellationToken);
        return Success<object>(null, "Driver license approved.");
    }

    [HttpPost("{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<object>>> Reject(long id, DriverLicenseReviewActionRequest request, CancellationToken cancellationToken = default)
    {
        await _driverLicenseService.RejectAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Driver license rejected.");
    }

    [HttpPost("{id:long}/request-more-info")]
    public async Task<ActionResult<ApiResponse<object>>> RequestMoreInfo(long id, DriverLicenseReviewActionRequest request, CancellationToken cancellationToken = default)
    {
        await _driverLicenseService.RequestMoreInfoAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Requested more driver license information.");
    }
}
