using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Application.Modules.Reports.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/disputes")]
public class DisputesController : BaseApiController
{
    private readonly IDisputeService _disputeService;
    private readonly ICurrentUserContext _currentUser;

    public DisputesController(IDisputeService disputeService, ICurrentUserContext currentUser)
    {
        _disputeService = disputeService;
        _currentUser = currentUser;
    }

    [Authorize(Roles = "Customer,Owner")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<DisputeResponse>>> Create(
        CreateDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var openedBy = _currentUser.DomainUserId!.Value;
        var result = await _disputeService.OpenAsync(request, openedBy, cancellationToken);
        return Ok(ApiResponse<DisputeResponse>.Succeeded(result, "Dispute created successfully."));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<DisputeResponse>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<DisputeResponse>.Succeeded(result));
    }

    [Authorize(Policy = "staff.dispute")]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DisputeResponse>>>> GetList(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _disputeService.GetListAsync(status, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<DisputeResponse>>.Succeeded(result));
    }

    [Authorize(Policy = "staff.dispute")]
    [HttpPut("{id:long}/resolve")]
    public async Task<ActionResult<ApiResponse<DisputeResponse>>> Resolve(
        long id,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var staffId = _currentUser.DomainUserId!.Value;
        request.Escalate = false;
        var result = await _disputeService.ResolveAsync(id, staffId, request, cancellationToken);
        return Ok(ApiResponse<DisputeResponse>.Succeeded(result, "Dispute resolved."));
    }

    [Authorize(Policy = "staff.dispute")]
    [HttpPut("{id:long}/escalate")]
    public async Task<ActionResult<ApiResponse<DisputeResponse>>> Escalate(
        long id,
        CancellationToken cancellationToken)
    {
        var staffId = _currentUser.DomainUserId!.Value;
        var request = new ResolveDisputeRequest { Escalate = true, Resolution = "Escalated to admin for review." };
        var result = await _disputeService.ResolveAsync(id, staffId, request, cancellationToken);
        return Ok(ApiResponse<DisputeResponse>.Succeeded(result, "Dispute escalated to admin."));
    }
}
