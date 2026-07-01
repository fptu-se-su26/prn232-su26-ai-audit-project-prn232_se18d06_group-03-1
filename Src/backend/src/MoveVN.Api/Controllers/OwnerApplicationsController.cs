using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Customer")]
[Route("api/owner-applications")]
public class OwnerApplicationsController : BaseApiController
{
    private readonly IOwnerApplicationService _ownerApplicationService;

    public OwnerApplicationsController(IOwnerApplicationService ownerApplicationService)
    {
        _ownerApplicationService = ownerApplicationService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CreateOwnerApplicationResponse>>> CreateApplication(CancellationToken cancellationToken)
    {
        var result = await _ownerApplicationService.CreateApplicationAsync(cancellationToken);
        return Success(result, "Owner application created successfully.");
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<OwnerApplicationResponse>>> GetCurrentApplication(CancellationToken cancellationToken)
    {
        var result = await _ownerApplicationService.GetCurrentApplicationAsync(cancellationToken);
        return Success(result);
    }

    [HttpPut("me/bank")]
    public async Task<ActionResult<ApiResponse<OwnerApplicationResponse>>> UpdateBankInfo(
        UpdateBankInfoRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _ownerApplicationService.UpdateBankInfoAsync(request, cancellationToken);
        return Success(result, "Bank information updated successfully.");
    }

    [HttpPost("me/submit")]
    public async Task<ActionResult<ApiResponse<SubmitOwnerApplicationResponse>>> SubmitApplication(CancellationToken cancellationToken)
    {
        var result = await _ownerApplicationService.SubmitApplicationAsync(cancellationToken);
        return Success(result, "Owner application submitted and approved successfully.");
    }

    [HttpPost("me/national-id")]
    public async Task<ActionResult<ApiResponse<NationalIdUploadResponse>>> UploadNationalId(
        IFormFile frontImage,
        IFormFile backImage,
        CancellationToken cancellationToken)
    {
        if (frontImage is null || frontImage.Length == 0)
        {
            return BadRequest(ApiResponse<NationalIdUploadResponse>.Failed("OWNER_6010", "Vui lòng upload ảnh mặt trước CCCD."));
        }

        if (backImage is null || backImage.Length == 0)
        {
            return BadRequest(ApiResponse<NationalIdUploadResponse>.Failed("OWNER_6010", "Vui lòng upload ảnh mặt sau CCCD."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var frontExt = Path.GetExtension(frontImage.FileName).ToLowerInvariant();
        var backExt = Path.GetExtension(backImage.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(frontExt) || !allowedExtensions.Contains(backExt))
        {
            return BadRequest(ApiResponse<NationalIdUploadResponse>.Failed("OWNER_6010", "Chỉ chấp nhận file JPG, PNG hoặc WebP."));
        }

        const int maxSize = 5 * 1024 * 1024;
        if (frontImage.Length > maxSize || backImage.Length > maxSize)
        {
            return BadRequest(ApiResponse<NationalIdUploadResponse>.Failed("OWNER_6010", "Kích thước file tối đa là 5MB."));
        }

        using var frontStream = new MemoryStream();
        await frontImage.CopyToAsync(frontStream, cancellationToken);
        frontStream.Position = 0;

        using var backStream = new MemoryStream();
        await backImage.CopyToAsync(backStream, cancellationToken);
        backStream.Position = 0;

        var result = await _ownerApplicationService.UploadNationalIdAsync(
            frontStream, frontImage.FileName, backStream, backImage.FileName, cancellationToken);

        return Success(result, result.Message ?? "National ID uploaded and processed.");
    }
}
