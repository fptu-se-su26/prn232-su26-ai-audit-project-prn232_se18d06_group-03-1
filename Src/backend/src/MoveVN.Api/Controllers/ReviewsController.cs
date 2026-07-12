using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Reviews.DTOs;
using MoveVN.Application.Modules.Reviews.Interfaces;

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

    [Authorize(Roles = "Customer")]
    [HttpPost("customer")]
    public async Task<ActionResult<ApiResponse<ReviewResponse>>> CreateCustomerReview(CreateReviewRequest request, CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _reviewService.CreateCustomerReviewAsync(request.BookingId, customerId, request, cancellationToken);
        return Success(result, "Danh gia thanh cong.");
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("owner")]
    public async Task<ActionResult<ApiResponse<ReviewResponse>>> CreateOwnerReview(CreateReviewRequest request, CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var result = await _reviewService.CreateOwnerReviewAsync(request.BookingId, ownerId, request, cancellationToken);
        return Success(result, "Danh gia thanh cong.");
    }

    [HttpGet("booking/{bookingId:long}")]
    public async Task<ActionResult<ApiResponse<List<ReviewResponse>>>> GetBookingReviews(long bookingId, CancellationToken cancellationToken)
    {
        var result = await _reviewService.GetBookingReviewsAsync(bookingId, cancellationToken);
        return Success(result);
    }

    [AllowAnonymous]
    [HttpGet("vehicle/{vehicleId:long}")]
    public async Task<ActionResult<ApiResponse<List<ReviewResponse>>>> GetVehicleReviews(long vehicleId, CancellationToken cancellationToken)
    {
        var result = await _reviewService.GetVehicleReviewsAsync(vehicleId, cancellationToken);
        return Success(result);
    }

    [Authorize]
    [HttpGet("booking/{bookingId:long}/has-reviewed")]
    public async Task<ActionResult<ApiResponse<bool>>> HasReviewed(long bookingId, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var result = await _reviewService.HasReviewedAsync(bookingId, userId, cancellationToken);
        return Success(result);
    }
}
