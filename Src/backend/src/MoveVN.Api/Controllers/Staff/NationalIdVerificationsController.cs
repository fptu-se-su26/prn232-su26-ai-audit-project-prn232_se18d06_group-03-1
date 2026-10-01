using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;

namespace MoveVN.Api.Controllers.Staff;

[Authorize(Roles = "Staff")]
[Route("api/staff/national-id-verifications")]
public class NationalIdVerificationsController : BaseApiController
{
    private readonly INationalIdReviewService _nationalIdReviewService;

    public NationalIdVerificationsController(INationalIdReviewService nationalIdReviewService)
    {
        _nationalIdReviewService = nationalIdReviewService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NationalIdVerificationListItem>>>> GetList(
        [FromQuery] string? status,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _nationalIdReviewService.GetListAsync(status, keyword, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<NationalIdVerificationDetailDto>>> GetById(long id, CancellationToken cancellationToken = default)
    {
        var result = await _nationalIdReviewService.GetDetailAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(long id, CancellationToken cancellationToken = default)
    {
        await _nationalIdReviewService.ApproveAsync(id, cancellationToken);
        return Success<object>(null, "National ID verified.");
    }

    [HttpPost("{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<object>>> Reject(long id, NationalIdReviewActionRequest request, CancellationToken cancellationToken = default)
    {
        await _nationalIdReviewService.RejectAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "National ID rejected.");
    }

    [HttpPost("{id:long}/request-more-info")]
    public async Task<ActionResult<ApiResponse<object>>> RequestMoreInfo(long id, NationalIdReviewActionRequest request, CancellationToken cancellationToken = default)
    {
        await _nationalIdReviewService.RequestMoreInfoAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Requested more national ID information.");
    }

    [HttpPost("{id:long}/test-ocr")]
    public async Task<ActionResult<ApiResponse<NationalIdPreVerifyResult>>> TestOcr(long id, CancellationToken cancellationToken = default)
    {
        var result = await _nationalIdReviewService.TestOcrAsync(id, cancellationToken);
        return Success(result, "OCR test completed without changing verification status.");
    }

    [HttpPost("test-ocr-upload")]
    public async Task<ActionResult<ApiResponse<NationalIdPreVerifyResult>>> TestOcrUpload(IFormFile image, CancellationToken cancellationToken = default)
    {
        if (image is null || image.Length == 0)
        {
            return BadRequest(ApiResponse<NationalIdPreVerifyResult>.Failed("OWNER_6010", "Vui lòng upload ảnh để test OCR."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowedExtensions.Contains(Path.GetExtension(image.FileName).ToLowerInvariant()))
        {
            return BadRequest(ApiResponse<NationalIdPreVerifyResult>.Failed("OWNER_6010", "Chỉ chấp nhận file JPG, PNG hoặc WebP."));
        }

        const int maxSize = 5 * 1024 * 1024;
        if (image.Length > maxSize)
        {
            return BadRequest(ApiResponse<NationalIdPreVerifyResult>.Failed("OWNER_6010", "Kích thước file tối đa là 5MB."));
        }

        using var stream = new MemoryStream();
        await image.CopyToAsync(stream, cancellationToken);
        var result = await _nationalIdReviewService.TestOcrUploadAsync(stream.ToArray(), image.FileName, cancellationToken);
        return Success(result, "OCR test completed without changing verification status.");
    }
}
