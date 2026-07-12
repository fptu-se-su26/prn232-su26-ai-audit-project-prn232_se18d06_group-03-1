using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Bookings.DTOs;
using MoveVN.Application.Modules.Bookings.Interfaces;

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

    [Authorize(Roles = "Customer")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Create(
        CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _bookingService.CreateAsync(request, customerId, cancellationToken);
        return Success(result, "Tạo booking thành công.");
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpGet("my-bookings")]
    public async Task<IActionResult> GetMyBookings(
        [FromQuery] BookingListRequest request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var (items, totalCount) = await _bookingService.GetMyBookingsAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(new { items, totalCount, page = request.Page, pageSize = request.PageSize }));
    }

    [Authorize(Roles = "Owner")]
    [HttpGet("owner")]
    public async Task<IActionResult> GetOwnerBookings(
        [FromQuery] BookingListRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var (items, totalCount) = await _bookingService.GetOwnerBookingsAsync(ownerId, request, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(new { items, totalCount, page = request.Page, pageSize = request.PageSize }));
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Approve(
        long id,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var result = await _bookingService.ApproveAsync(id, ownerId, cancellationToken);
        return Success(result, "Đã duyệt booking.");
    }

    [Authorize(Roles = "Customer")]
    [HttpPut("{id:long}/confirm-deposit")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> ConfirmDeposit(
        long id,
        CancellationToken cancellationToken)
    {
        var customerId = _currentUser.UserId!.Value;
        var result = await _bookingService.ConfirmDepositAsync(id, customerId, cancellationToken);
        return Success(result, "Xác nhận cọc thành công.");
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Reject(
        long id,
        RejectBookingRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var result = await _bookingService.RejectAsync(id, ownerId, request, cancellationToken);
        return Success(result, "Đã từ chối booking.");
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:long}/complete")]
    public async Task<ActionResult<ApiResponse<BookingResponse>>> Complete(
        long id,
        CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var result = await _bookingService.CompleteAsync(id, ownerId, cancellationToken);
        return Success(result, "Đã hoàn thành booking.");
    }
}
