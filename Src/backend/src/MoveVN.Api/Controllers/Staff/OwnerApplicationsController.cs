using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;

namespace MoveVN.Api.Controllers.Staff;

[Authorize(Roles = "Staff")]
[Route("api/staff/owner-applications")]
public class OwnerApplicationsController : BaseApiController
{
    private readonly IStaffOwnerApplicationService _staffOwnerApplicationService;

    public OwnerApplicationsController(IStaffOwnerApplicationService staffOwnerApplicationService)
    {
        _staffOwnerApplicationService = staffOwnerApplicationService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<StaffOwnerApplicationListItem>>>> GetApplications(
        [FromQuery] string? status,
        [FromQuery] string? keyword,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var result = await _staffOwnerApplicationService.GetApplicationsAsync(status, keyword, fromDate, toDate, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<StaffOwnerApplicationDetailResponse>>> GetApplicationDetail(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _staffOwnerApplicationService.GetApplicationDetailAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveApplication(long id, CancellationToken cancellationToken)
    {
        await _staffOwnerApplicationService.ApproveApplicationAsync(id, cancellationToken);
        return Success<object>(null, "Application approved successfully.");
    }

    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApiResponse<object>>> RejectApplication(
        long id,
        StaffOwnerApplicationActionRequest request,
        CancellationToken cancellationToken)
    {
        await _staffOwnerApplicationService.RejectApplicationAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Application rejected.");
    }

    [HttpPost("{id}/request-more-info")]
    public async Task<ActionResult<ApiResponse<object>>> RequestMoreInfo(
        long id,
        StaffOwnerApplicationActionRequest request,
        CancellationToken cancellationToken)
    {
        await _staffOwnerApplicationService.RequestMoreInfoAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Requested more information from applicant.");
    }
}
