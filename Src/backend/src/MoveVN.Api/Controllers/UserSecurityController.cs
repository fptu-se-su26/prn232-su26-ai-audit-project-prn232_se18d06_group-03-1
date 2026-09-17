using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.UserSecurity.DTOs;
using MoveVN.Application.Modules.UserSecurity.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/v1/user")]
public class UserSecurityController : BaseApiController
{
    private readonly IPinService _pinService;

    public UserSecurityController(IPinService pinService)
    {
        _pinService = pinService;
    }

    [HttpGet("pin/status")]
    public async Task<ActionResult<ApiResponse<PinStatusResponse>>> GetPinStatus(CancellationToken cancellationToken)
    {
        var result = await _pinService.GetStatusAsync(cancellationToken);
        return Success(result);
    }

    [HttpPost("pin/setup/request-otp")]
    public async Task<ActionResult<ApiResponse<bool>>> RequestSetupPinOtp(CancellationToken cancellationToken)
    {
        await _pinService.RequestSetupPinOtpAsync(cancellationToken);
        return Success(true, "Mã OTP thiết lập mã PIN đã được gửi tới email của bạn.");
    }

    [HttpPost("pin/setup")]
    public async Task<ActionResult<ApiResponse<bool>>> SetupPin(
        [FromBody] SetupPinRequest request,
        CancellationToken cancellationToken)
    {
        await _pinService.SetupPinAsync(request, cancellationToken);
        return Success(true, "Thiết lập mã PIN thành công.");
    }

    [HttpPost("pin/change")]
    public async Task<ActionResult<ApiResponse<bool>>> ChangePin(
        [FromBody] ChangePinRequest request,
        CancellationToken cancellationToken)
    {
        await _pinService.ChangePinAsync(request, cancellationToken);
        return Success(true, "Đổi mã PIN thành công.");
    }

    [HttpPost("pin/verify-view-document")]
    public async Task<ActionResult<ApiResponse<ViewDocumentPlaintextResponse>>> VerifyPinAndViewDocument(
        [FromBody] VerifyPinViewDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _pinService.VerifyPinAndViewDocumentAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpPost("pin/forgot/request-otp")]
    public async Task<ActionResult<ApiResponse<bool>>> RequestForgotPinOtp(
        [FromBody] ForgotPinRequestOtpRequest request,
        CancellationToken cancellationToken)
    {
        await _pinService.RequestForgotPinOtpAsync(request, cancellationToken);
        return Success(true, "Mã OTP đặt lại mã PIN đã được gửi tới email của bạn.");
    }

    [HttpPost("pin/forgot/reset")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetPin(
        [FromBody] ForgotPinResetRequest request,
        CancellationToken cancellationToken)
    {
        await _pinService.ResetPinAsync(request, cancellationToken);
        return Success(true, "Đặt lại mã PIN thành công.");
    }
}