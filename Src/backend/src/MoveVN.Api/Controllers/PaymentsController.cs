using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Payments.DTOs;
using MoveVN.Application.Modules.Payments.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/payments")]
public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _paymentService;
    private readonly ICurrentUserContext _currentUser;

    public PaymentsController(IPaymentService paymentService, ICurrentUserContext currentUser)
    {
        _paymentService = paymentService;
        _currentUser = currentUser;
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("deposit/{bookingId:long}")]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> PayDeposit(
        long bookingId,
        CreatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        request.BookingId = bookingId;
        request.Type = "Deposit";
        var payerId = _currentUser.DomainUserId!.Value;
        var result = await _paymentService.CreateDepositAsync(bookingId, payerId, request.IdempotencyKey, cancellationToken);
        return Ok(ApiResponse<PaymentResponse>.Succeeded(result, "Deposit payment initiated."));
    }

    [HttpGet("booking/{bookingId:long}")]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> GetByBooking(
        long bookingId,
        CancellationToken cancellationToken)
    {
        var result = await _paymentService.GetByBookingAsync(bookingId, cancellationToken);
        if (result is null)
            return NotFound(ApiResponse<PaymentResponse>.Failed("Payment not found."));
        return Ok(ApiResponse<PaymentResponse>.Succeeded(result));
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPost("refund/{bookingId:long}")]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> RefundDeposit(
        long bookingId,
        RefundPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var staffId = _currentUser.DomainUserId!.Value;
        var result = await _paymentService.RefundDepositAsync(bookingId, staffId, request, cancellationToken);
        return Ok(ApiResponse<PaymentResponse>.Succeeded(result, "Refund processed successfully."));
    }
}
