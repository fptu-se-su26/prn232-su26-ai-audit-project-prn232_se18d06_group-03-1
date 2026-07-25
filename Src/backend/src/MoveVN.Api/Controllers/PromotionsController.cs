using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Promotions.DTOs;
using MoveVN.Application.Modules.Promotions.Interfaces;

namespace MoveVN.Api.Controllers;

[ApiController]
[Route("api/promotions")]
[Authorize]
public class PromotionsController : ControllerBase
{
    private readonly IPromotionService _svc;

    public PromotionsController(IPromotionService svc) => _svc = svc;

    [HttpPost]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<ActionResult<ApiResponse<PromotionResponse>>> Create([FromBody] CreatePromotionRequest req, CancellationToken ct)
    {
        var ownerId = User.IsInRole("Owner") ? long.Parse(User.FindFirst("sub")?.Value ?? "0") : req.OwnerId;
        var result = await _svc.CreateAsync(req, ownerId, ct);
        return Ok(ApiResponse<PromotionResponse>.Succeeded(result));
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PromotionResponse>>> Update(long id, [FromBody] UpdatePromotionRequest req, CancellationToken ct)
    {
        var result = await _svc.UpdateAsync(id, req, ct);
        return Ok(ApiResponse<PromotionResponse>.Succeeded(result));
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(long id, CancellationToken ct)
    {
        await _svc.DeleteAsync(id, ct);
        return Ok(ApiResponse<object>.Succeeded(new { message = "Đã xóa." }));
    }

    [HttpPatch("{id:long}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> ToggleActive(long id, CancellationToken ct)
    {
        var isActive = await _svc.ToggleActiveAsync(id, ct);
        return Ok(ApiResponse<object>.Succeeded(new { isActive }));
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PromotionResponse>>> GetById(long id, CancellationToken ct)
    {
        var result = await _svc.GetByIdAsync(id, ct);
        if (result is null) return NotFound(ApiResponse<PromotionResponse>.Failed("NOT_FOUND", "Không tìm thấy."));
        return Ok(ApiResponse<PromotionResponse>.Succeeded(result));
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> List([FromQuery] string? keyword, [FromQuery] bool? isActive,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var (items, total) = await _svc.GetListAsync(keyword, isActive, page, pageSize, ct);
        return Ok(ApiResponse<object>.Succeeded(new { items, total, page, pageSize }));
    }

    [HttpPost("validate")]
    [Authorize(Roles = "Admin,Customer")]
    public async Task<ActionResult<ApiResponse<ApplyPromotionResponse>>> Validate([FromBody] ApplyPromotionRequest req, CancellationToken ct)
    {
        var userId = long.Parse(User.FindFirst("sub")?.Value ?? "0");
        var result = await _svc.ValidateAndCalculateAsync(req, userId, ct);
        if (!result.Success)
            return Ok(ApiResponse<ApplyPromotionResponse>.Failed("PROMO_INVALID", result.Message!));
        return Ok(ApiResponse<ApplyPromotionResponse>.Succeeded(result));
    }

    [HttpGet("{id:long}/usages")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<PromotionUsageResponse>>>> GetUsages(long id, CancellationToken ct)
    {
        var result = await _svc.GetUsagesAsync(id, ct);
        return Ok(ApiResponse<List<PromotionUsageResponse>>.Succeeded(result));
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<PromotionResponse>>>> GetActive([FromQuery] long? vehicleId, CancellationToken ct)
    {
        var result = await _svc.GetActiveForCustomerAsync(vehicleId, ct);
        return Ok(ApiResponse<List<PromotionResponse>>.Succeeded(result));
    }

    [HttpPost("{id:long}/approve")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<PromotionResponse>>> Approve(long id, CancellationToken ct)
    {
        var ownerId = long.Parse(User.FindFirst("sub")?.Value ?? "0");
        var result = await _svc.ApproveAsync(id, ownerId, ct);
        return Ok(ApiResponse<PromotionResponse>.Succeeded(result));
    }

    [HttpPost("{id:long}/admin-approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PromotionResponse>>> AdminApprove(long id, CancellationToken ct)
    {
        var result = await _svc.AdminUpdateApprovalAsync(id, "Approved", ct);
        return Ok(ApiResponse<PromotionResponse>.Succeeded(result));
    }

    [HttpPost("{id:long}/admin-reject")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PromotionResponse>>> AdminReject(long id, CancellationToken ct)
    {
        var result = await _svc.AdminUpdateApprovalAsync(id, "Rejected", ct);
        return Ok(ApiResponse<PromotionResponse>.Succeeded(result));
    }

    [HttpPost("{id:long}/reject")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<PromotionResponse>>> Reject(long id, CancellationToken ct)
    {
        var ownerId = long.Parse(User.FindFirst("sub")?.Value ?? "0");
        var result = await _svc.RejectAsync(id, ownerId, ct);
        return Ok(ApiResponse<PromotionResponse>.Succeeded(result));
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<List<PromotionResponse>>>> GetPending(CancellationToken ct)
    {
        var ownerId = long.Parse(User.FindFirst("sub")?.Value ?? "0");
        var result = await _svc.GetPendingForOwnerAsync(ownerId, ct);
        return Ok(ApiResponse<List<PromotionResponse>>.Succeeded(result));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Owner")]
    public async Task<ActionResult<ApiResponse<List<PromotionResponse>>>> GetMy(CancellationToken ct)
    {
        var ownerId = long.Parse(User.FindFirst("sub")?.Value ?? "0");
        var result = await _svc.GetMyPromotionsAsync(ownerId, ct);
        return Ok(ApiResponse<List<PromotionResponse>>.Succeeded(result));
    }
}
