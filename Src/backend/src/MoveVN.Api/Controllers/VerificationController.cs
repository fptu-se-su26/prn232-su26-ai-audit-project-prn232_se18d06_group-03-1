using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Route("api/verifications")]
public class VerificationController : BaseApiController
{
    private readonly IVerificationService _verificationService;
    private readonly ICurrentUserContext _currentUser;

    public VerificationController(IVerificationService verificationService, ICurrentUserContext currentUser)
    {
        _verificationService = verificationService;
        _currentUser = currentUser;
    }

    [Authorize(Roles = "Customer")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<VerificationDto>>> Submit(
        [FromForm] CreateVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _verificationService.SubmitAsync(request, userId, cancellationToken);
        return Ok(ApiResponse<VerificationDto>.Succeeded(result, "Verification submitted."));
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<List<VerificationDto>>>> GetMyVerifications(CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _verificationService.GetByUserAsync(userId, cancellationToken);
        return Ok(ApiResponse<List<VerificationDto>>.Succeeded(result));
    }

    [Authorize(Policy = "staff.verify")]
    [HttpGet("queue")]
    public async Task<ActionResult<ApiResponse<PagedResult<VerificationDto>>>> GetQueue(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _verificationService.GetPendingQueueAsync(page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<VerificationDto>>.Succeeded(result));
    }

    [Authorize(Policy = "staff.verify")]
    [HttpPut("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<VerificationDto>>> Approve(
        long id,
        CancellationToken cancellationToken)
    {
        var staffId = _currentUser.DomainUserId!.Value;
        var request = new ReviewVerificationRequest { Approve = true };
        var result = await _verificationService.ReviewAsync(id, staffId, request, cancellationToken);
        return Ok(ApiResponse<VerificationDto>.Succeeded(result, "Verification approved."));
    }

    [Authorize(Policy = "staff.verify")]
    [HttpPut("{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<VerificationDto>>> Reject(
        long id,
        ReviewVerificationRequest request,
        CancellationToken cancellationToken)
    {
        request.Approve = false;
        var staffId = _currentUser.DomainUserId!.Value;
        var result = await _verificationService.ReviewAsync(id, staffId, request, cancellationToken);
        return Ok(ApiResponse<VerificationDto>.Succeeded(result, "Verification rejected."));
    }
}
