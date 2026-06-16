using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Reviews.DTOs;
using MoveVN.Application.Modules.Reviews.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Route("api/reviews")]
public class ReviewsController : BaseApiController
{
    private readonly IReviewService _reviewService;
    private readonly ICurrentUserContext _currentUser;

    public ReviewsController(IReviewService reviewService, ICurrentUserContext currentUser)
    {
        _reviewService = reviewService;
        _currentUser = currentUser;
    }

    [Authorize(Roles = "Customer,Owner")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ReviewResponse>>> Create(
        CreateReviewRequest request,
        CancellationToken cancellationToken)
    {
        var reviewerId = _currentUser.DomainUserId!.Value;
        var result = await _reviewService.CreateAsync(request, reviewerId, cancellationToken);
        return Ok(ApiResponse<ReviewResponse>.Succeeded(result, "Review submitted successfully."));
    }

    [HttpGet("vehicle/{vehicleId:long}")]
    public async Task<ActionResult<ApiResponse<List<ReviewResponse>>>> GetByVehicle(
        long vehicleId,
        CancellationToken cancellationToken)
    {
        var result = await _reviewService.GetByVehicleAsync(vehicleId, cancellationToken);
        return Ok(ApiResponse<List<ReviewResponse>>.Succeeded(result));
    }

    [Authorize]
    [HttpGet("booking/{bookingId:long}")]
    public async Task<ActionResult<ApiResponse<ReviewResponse>>> GetByBooking(
        long bookingId,
        CancellationToken cancellationToken)
    {
        return Ok(ApiResponse<ReviewResponse>.Succeeded(null));
    }
}
