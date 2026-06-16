using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/bookings")]
public class BookingsController : BaseApiController
{
    private readonly IBookingService _bookingService;
    private readonly ICurrentUserContext _currentUser;

    public BookingsController(IBookingService bookingService, ICurrentUserContext currentUser)
    {
        _bookingService = bookingService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<BookingResponse>>>> GetMyBookings(
        [FromQuery] BookingQueryRequest request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _bookingService.GetMyBookingsAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<PagedResult<BookingResponse>>.Succeeded(result));
    }

    [Authorize(Roles = "Customer")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Create(
        CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var customerId = _currentUser.DomainUserId!.Value;
        var result = await _bookingService.CreateAsync(request, customerId, cancellationToken);
        return Ok(ApiResponse<BookingResponse>.Succeeded(result, "Booking created successfully."));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponse>.Succeeded(result));
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Approve(
        long id,
        ApproveBookingRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.DomainUserId!.Value;
        var result = await _bookingService.ApproveAsync(id, ownerId, request, cancellationToken);
        var message = request.Approve ? "Booking approved." : "Booking rejected.";
        return Ok(ApiResponse<BookingResponse>.Succeeded(result, message));
    }

    [Authorize(Roles = "Owner")]
    [HttpGet("~/api/vehicles/{vehicleId:long}/bookings")]
    public async Task<ActionResult<ApiResponse<PagedResult<BookingResponse>>>> GetOwnerBookings(
        long vehicleId,
        [FromQuery] BookingQueryRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.DomainUserId!.Value;
        var result = await _bookingService.GetOwnerBookingsAsync(vehicleId, ownerId, request, cancellationToken);
        return Ok(ApiResponse<PagedResult<BookingResponse>>.Succeeded(result));
    }
}
