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

    [HttpPost("attachments")]
    public async Task<ActionResult<ApiResponse<object>>> UploadAttachment(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<object>.Failed("SUPPORT_TICKET_9001", "Attachment image file is required."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(ApiResponse<object>.Failed("SUPPORT_TICKET_9001", "Only JPG, PNG, or WebP support ticket images are allowed."));
        }

        const int maxSize = 5 * 1024 * 1024;
        if (file.Length > maxSize)
        {
            return BadRequest(ApiResponse<object>.Failed("SUPPORT_TICKET_9001", "Support ticket image must be under 5MB."));
        }

        var userId = _currentUser.UserId!.Value;
        await using var stream = file.OpenReadStream();
        var url = await _supportTicketService.UploadAttachmentAsync(stream, file.FileName, userId, cancellationToken);
        return Success<object>(new { url });
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
