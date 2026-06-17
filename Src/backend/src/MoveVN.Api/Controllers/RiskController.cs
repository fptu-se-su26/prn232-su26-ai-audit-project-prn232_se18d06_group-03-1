using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/risk")]
public class RiskController : BaseApiController
{
    private readonly IRiskScoringService _riskScoringService;

    public RiskController(IRiskScoringService riskScoringService)
    {
        _riskScoringService = riskScoringService;
    }

    [HttpGet("booking/{bookingId:long}")]
    public async Task<ActionResult<ApiResponse<RiskPredictionDto>>> GetLatestByBooking(long bookingId, CancellationToken cancellationToken)
    {
        var result = await _riskScoringService.GetLatestByBookingAsync(bookingId, cancellationToken);
        if (result is null)
            return NotFound(ApiResponse<RiskPredictionDto>.Failed("Risk prediction not found."));
        return Ok(ApiResponse<RiskPredictionDto>.Succeeded(result));
    }

    [Authorize(Policy = "staff.dispute")]
    [HttpGet("high-risk-bookings")]
    public async Task<ActionResult<ApiResponse<PagedResult<BookingResponse>>>> GetHighRiskBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _riskScoringService.GetHighRiskBookingsAsync(page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<BookingResponse>>.Succeeded(result));
    }
}
