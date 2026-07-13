using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Withdrawals.DTOs;
using MoveVN.Application.Modules.Withdrawals.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
public class WithdrawalsController : BaseApiController
{
    private readonly IWithdrawalService _service;
    private readonly ICurrentUserContext _currentUser;

    public WithdrawalsController(IWithdrawalService service, ICurrentUserContext currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    // ──── Owner endpoints ────

    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<WithdrawalRequestDto>>> Create(
        [FromBody] CreateWithdrawalRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId!.Value;
        var result = await _service.CreateAsync(userId, request, ct);
        return Success(result, "Yêu cầu rút tiền đã được tạo.");
    }

    [HttpGet("my")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyWithdrawals(
        [FromQuery] WithdrawalListRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId!.Value;
        var (items, totalCount) = await _service.GetMyWithdrawalsAsync(userId, request, ct);
        return Success<object>(new { items, totalCount, page = request.Page, pageSize = request.PageSize });
    }

    // ──── Bank Account OTP ────

    [HttpGet("bank-account")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<OwnerBankDetailsDto>>> GetBankAccount(CancellationToken ct)
    {
        var userId = _currentUser.UserId!.Value;
        var result = await _service.GetBankAccountAsync(userId, ct);
        return Success(result);
    }

    [HttpPost("bank-account/request-otp")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<object>>> RequestBankAccountOtp(CancellationToken ct)
    {
        var userId = _currentUser.UserId!.Value;
        await _service.RequestBankAccountOtpAsync(userId, ct);
        return Success<object>(null!, "Mã OTP đã được gửi đến email của bạn.");
    }

    [HttpPost("bank-account/verify")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyBankAccountOtp(
        [FromBody] VerifyBankAccountOtpRequest request, CancellationToken ct)
    {
        var userId = _currentUser.UserId!.Value;
        await _service.VerifyBankAccountOtpAsync(userId, request, ct);
        return Success<object>(null!, "Cập nhật tài khoản ngân hàng thành công.");
    }

    // ──── Staff/Admin endpoints ────

    [HttpGet("all")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> GetAllWithdrawals(
        [FromQuery] WithdrawalListRequest request, CancellationToken ct)
    {
        var (items, totalCount) = await _service.GetAllWithdrawalsAsync(request, ct);
        return Success<object>(new { items, totalCount, page = request.Page, pageSize = request.PageSize });
    }

    [HttpPut("{id:long}/approve")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<ApiResponse<WithdrawalRequestDto>>> Approve(
        long id, [FromBody] ProcessWithdrawalRequest request, CancellationToken ct)
    {
        var staffId = _currentUser.UserId!.Value;
        var result = await _service.ApproveAsync(id, staffId, request, ct);
        return Success(result, "Đã duyệt yêu cầu rút tiền.");
    }

    [HttpPut("{id:long}/complete")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<ApiResponse<WithdrawalRequestDto>>> Complete(
        long id, [FromBody] ProcessWithdrawalRequest request, CancellationToken ct)
    {
        var staffId = _currentUser.UserId!.Value;
        var result = await _service.CompleteAsync(id, staffId, request, ct);
        return Success(result, "Xác nhận đã chuyển khoản thành công.");
    }

    [HttpPut("{id:long}/reject")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<ApiResponse<WithdrawalRequestDto>>> Reject(
        long id, [FromBody] RejectWithdrawalRequest request, CancellationToken ct)
    {
        var staffId = _currentUser.UserId!.Value;
        var result = await _service.RejectAsync(id, staffId, request, ct);
        return Success(result, "Đã từ chối yêu cầu rút tiền.");
    }
}
