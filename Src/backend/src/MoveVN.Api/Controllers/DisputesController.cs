using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Disputes.DTOs;
using MoveVN.Application.Modules.Disputes.Interfaces;

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
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> Create(
        CreateDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.CreateAsync(request, CurrentUserId(), ActorRole(), cancellationToken);
        return Success(result, "Dispute created.");
    }

    [Authorize(Roles = "Customer,Owner")]
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResult<DisputeListItem>>>> GetMine(
        [FromQuery] DisputeListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.GetMineAsync(CurrentUserId(), request, cancellationToken);
        return Success(result);
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpGet("staff")]
    public async Task<ActionResult<ApiResponse<PagedResult<DisputeListItem>>>> GetStaffQueue(
        [FromQuery] DisputeListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.GetStaffQueueAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.GetByIdAsync(id, CurrentUserId(), IsStaffOrAdmin(), cancellationToken);
        return Success(result);
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPut("{id:long}/investigate")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> Investigate(long id, CancellationToken cancellationToken)
    {
        var result = await _disputeService.MarkInvestigatingAsync(id, CurrentUserId(), ActorRole(), cancellationToken);
        return Success(result, "Dispute moved to investigating.");
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPut("{id:long}/resolve")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> Resolve(
        long id,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.ResolveAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "Dispute resolved.");
    }

    [Authorize(Roles = "Staff")]
    [HttpPut("{id:long}/escalate")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> Escalate(
        long id,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.EscalateAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "Dispute escalated.");
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:long}/admin-override")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> AdminOverride(
        long id,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.AdminOverrideAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "Admin override applied.");
    }

    private long CurrentUserId()
        => _currentUser.UserId!.Value;

    private bool IsStaffOrAdmin()
        => User.IsInRole("Staff") || User.IsInRole("Admin");

    private string ActorRole()
    {
        if (User.IsInRole("Admin")) return "Admin";
        if (User.IsInRole("Staff")) return "Staff";
        if (User.IsInRole("Owner")) return "Owner";
        return "Customer";
    }
}
