using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/national-id-verifications")]
public class NationalIdVerificationsController : BaseApiController
{
    private readonly INationalIdReviewService _nationalIdReviewService;

    public NationalIdVerificationsController(INationalIdReviewService nationalIdReviewService)
    {
        _nationalIdReviewService = nationalIdReviewService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NationalIdVerificationListItem>>>> GetList(
        [FromQuery] string? status,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _nationalIdReviewService.GetListAsync(status, keyword, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<NationalIdVerificationDetailDto>>> GetById(long id, CancellationToken cancellationToken = default)
    {
        var result = await _nationalIdReviewService.GetDetailAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(long id, CancellationToken cancellationToken = default)
    {
        await _nationalIdReviewService.ApproveAsync(id, cancellationToken);
        return Success<object>(null, "National ID verified.");
    }

    [HttpPost("{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<object>>> Reject(long id, NationalIdReviewActionRequest request, CancellationToken cancellationToken = default)
    {
        await _nationalIdReviewService.RejectAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "National ID rejected.");
    }

    [HttpPost("{id:long}/request-more-info")]
    public async Task<ActionResult<ApiResponse<object>>> RequestMoreInfo(long id, NationalIdReviewActionRequest request, CancellationToken cancellationToken = default)
    {
        await _nationalIdReviewService.RequestMoreInfoAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Requested more national ID information.");
    }
}
