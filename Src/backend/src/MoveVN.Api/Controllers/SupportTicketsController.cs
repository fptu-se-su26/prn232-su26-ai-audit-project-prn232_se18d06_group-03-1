using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.SupportTickets.DTOs;
using MoveVN.Application.Modules.SupportTickets.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/support-tickets")]
public class SupportTicketsController : BaseApiController
{
    private readonly ISupportTicketService _supportTicketService;
    private readonly ICurrentUserContext _currentUser;

    public SupportTicketsController(ISupportTicketService supportTicketService, ICurrentUserContext currentUser)
    {
        _supportTicketService = supportTicketService;
        _currentUser = currentUser;
    }

    [Authorize(Roles = "Customer")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailResponse>>> Create(
        CreateSupportTicketRequest request,
        CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _supportTicketService.CreateAsync(request, customerId, cancellationToken);
        return Success(result, "Support ticket created.");
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResult<SupportTicketListItem>>>> GetMine(
        [FromQuery] SupportTicketListRequest request,
        CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _supportTicketService.GetMineAsync(customerId, request, cancellationToken);
        return Success(result);
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpGet("staff")]
    public async Task<ActionResult<ApiResponse<PagedResult<SupportTicketListItem>>>> GetStaffQueue(
        [FromQuery] SupportTicketListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _supportTicketService.GetStaffQueueAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailResponse>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var result = await _supportTicketService.GetByIdAsync(id, userId, IsStaffOrAdmin(), cancellationToken);
        return Success(result);
    }

    [HttpPost("{id:long}/messages")]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailResponse>>> AddMessage(
        long id,
        AddTicketMessageRequest request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var result = await _supportTicketService.AddMessageAsync(id, userId, IsStaffOrAdmin(), request, cancellationToken);
        return Success(result, "Message added.");
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPut("{id:long}/status")]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailResponse>>> UpdateStatus(
        long id,
        UpdateSupportTicketStatusRequest request,
        CancellationToken cancellationToken)
    {
        var staffId = _currentUser.UserId!.Value;
        var result = await _supportTicketService.UpdateStatusAsync(id, staffId, request, cancellationToken);
        return Success(result, "Support ticket updated.");
    }

    private bool IsStaffOrAdmin()
        => User.IsInRole("Staff") || User.IsInRole("Admin");
}
