using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Reports.DTOs;
using MoveVN.Application.Modules.Reports.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> Create(
        CreateTicketRequest request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _supportTicketService.CreateAsync(request, userId, cancellationToken);
        return Ok(ApiResponse<SupportTicketDto>.Succeeded(result, "Ticket created successfully."));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<SupportTicketDto>>>> GetMyTickets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _supportTicketService.GetMyTicketsAsync(userId, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<SupportTicketDto>>.Succeeded(result));
    }

    [Authorize(Policy = "staff.verify")]
    [HttpGet("queue")]
    public async Task<ActionResult<ApiResponse<PagedResult<SupportTicketDto>>>> GetQueue(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _supportTicketService.GetQueueAsync(page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<SupportTicketDto>>.Succeeded(result));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _supportTicketService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<SupportTicketDetailDto>.Succeeded(result));
    }

    [HttpPost("{id:long}/messages")]
    public async Task<ActionResult<ApiResponse<TicketMessageDto>>> Reply(
        long id,
        SendTicketMessageRequest request,
        CancellationToken cancellationToken)
    {
        var senderId = _currentUser.DomainUserId!.Value;
        var result = await _supportTicketService.ReplyAsync(id, request, senderId, cancellationToken);
        return Ok(ApiResponse<TicketMessageDto>.Succeeded(result, "Message sent."));
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPut("{id:long}/status")]
    public async Task<ActionResult<ApiResponse<object>>> ChangeStatus(
        long id,
        CancellationToken cancellationToken)
    {
        var staffId = _currentUser.DomainUserId!.Value;
        await _supportTicketService.CloseAsync(id, staffId, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(null, "Ticket status updated."));
    }
}
