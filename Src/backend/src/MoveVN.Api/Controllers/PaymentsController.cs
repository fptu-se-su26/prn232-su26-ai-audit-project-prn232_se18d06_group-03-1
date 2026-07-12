using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Payments.DTOs;
using MoveVN.Application.Modules.Payments.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _paymentService;
    private readonly ICurrentUserContext _currentUser;

    public PaymentsController(IPaymentService paymentService, ICurrentUserContext currentUser)
    {
        _paymentService = paymentService;
        _currentUser = currentUser;
    }

    [HttpPost("booking/{bookingId}")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<ApiResponse<CreatePaymentLinkResponse>>> CreatePaymentLink(
        long bookingId, 
        [FromQuery] string? returnUrl,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var response = await _paymentService.CreatePaymentLinkAsync(bookingId, userId, returnUrl, cancellationToken);
        return Success(response);
    }

    [HttpPost("wallet/topup")]
    public async Task<ActionResult<ApiResponse<CreatePaymentLinkResponse>>> CreateTopUpPaymentLink([FromBody] TopUpRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId!.Value;
        var response = await _paymentService.CreateTopUpPaymentLinkAsync(userId, request.Amount, cancellationToken);
        return Success(response);
    }
}

public class TopUpRequest
{
    public decimal Amount { get; set; }
}
