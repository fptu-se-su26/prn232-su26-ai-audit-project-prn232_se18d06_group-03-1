using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenses.DTOs;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;

namespace MoveVN.Api.Controllers.Staff;

[Authorize(Roles = "Staff")]
[Route("api/staff/driver-license-verifications")]
public class DriverLicenseVerificationsController : BaseApiController
{
    private readonly IDriverLicenseService _driverLicenseService;

    public DriverLicenseVerificationsController(IDriverLicenseService driverLicenseService)
    {
        _driverLicenseService = driverLicenseService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DriverLicenseVerificationListItem>>>> GetList(
        [FromQuery] string? status,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseService.GetVerificationsAsync(status, keyword, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<DriverLicenseVerificationRequestDto>>> GetById(long id, CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseService.GetVerificationByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost("{id:long}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(long id, [FromBody] DriverLicenseApproveRequest? request, CancellationToken cancellationToken = default)
    {
        await _driverLicenseService.ApproveAsync(id, request ?? new DriverLicenseApproveRequest(), cancellationToken);
        return Success<object>(null, "Driver license approved.");
    }

    [HttpPost("{id:long}/reject")]
    public async Task<ActionResult<ApiResponse<object>>> Reject(long id, DriverLicenseReviewActionRequest request, CancellationToken cancellationToken = default)
    {
        await _driverLicenseService.RejectAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Driver license rejected.");
    }

    [HttpPost("{id:long}/request-more-info")]
    public async Task<ActionResult<ApiResponse<object>>> RequestMoreInfo(long id, DriverLicenseReviewActionRequest request, CancellationToken cancellationToken = default)
    {
        await _driverLicenseService.RequestMoreInfoAsync(id, request.Reason, cancellationToken);
        return Success<object>(null, "Requested more driver license information.");
    }

    [HttpPost("{id:long}/test-ocr")]
    public async Task<ActionResult<ApiResponse<DriverLicenseVerificationResult>>> TestOcr(long id, CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseService.TestOcrAsync(id, cancellationToken);
        return Success(result, "OCR test completed without changing verification status.");
    }

    [HttpPost("test-ocr-upload")]
    public async Task<ActionResult<ApiResponse<DriverLicenseVerificationResult>>> TestOcrUpload(IFormFile image, [FromForm] string? fullName, CancellationToken cancellationToken = default)
    {
        if (image is null || image.Length == 0)
        {
            return BadRequest(ApiResponse<DriverLicenseVerificationResult>.Failed("LICENSE_8302", "Vui lòng upload ảnh để test OCR."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowedExtensions.Contains(Path.GetExtension(image.FileName).ToLowerInvariant()))
        {
            return BadRequest(ApiResponse<DriverLicenseVerificationResult>.Failed("LICENSE_8302", "Chỉ chấp nhận file JPG, PNG hoặc WebP."));
        }

        const int maxSize = 5 * 1024 * 1024;
        if (image.Length > maxSize)
        {
            return BadRequest(ApiResponse<DriverLicenseVerificationResult>.Failed("LICENSE_8302", "Kích thước file tối đa là 5MB."));
        }

        using var stream = new MemoryStream();
        await image.CopyToAsync(stream, cancellationToken);
        var result = await _driverLicenseService.TestOcrUploadAsync(stream.ToArray(), image.FileName, fullName, cancellationToken);
        return Success(result, "OCR test completed without changing verification status.");
    }
}
