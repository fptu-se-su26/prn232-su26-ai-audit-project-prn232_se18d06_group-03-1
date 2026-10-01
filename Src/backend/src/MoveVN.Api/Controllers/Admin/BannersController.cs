using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Banners.DTOs;
using MoveVN.Application.Modules.Banners.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/banners")]
public class BannersController : BaseApiController
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxFileBytes = 5 * 1024 * 1024;
    private const string BannerFolder = "movevn/banners";

    private readonly IBannerService _service;
    private readonly ICloudinaryService _cloudinary;
    private readonly ICurrentUserContext _currentUser;

    public BannersController(IBannerService service, ICloudinaryService cloudinary, ICurrentUserContext currentUser)
    {
        _service = service;
        _cloudinary = cloudinary;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<BannerResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
        => Success(await _service.GetListAsync(keyword, isActive, page, pageSize, cancellationToken));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<BannerResponse>>> GetById(long id, CancellationToken cancellationToken = default)
    {
        var result = await _service.GetByIdAsync(id, cancellationToken);
        if (result is null)
            return NotFound(ApiResponse<BannerResponse>.Failed(
                ErrorCode.BANNER_NOT_FOUND.Code, ErrorCode.BANNER_NOT_FOUND.Message));
        return Success(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<BannerResponse>>> Create(
        [FromBody] CreateBannerRequest request, CancellationToken cancellationToken = default)
    {
        var createdBy = _currentUser.UserId ?? 0;
        return Success(await _service.CreateAsync(request, createdBy, cancellationToken));
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ApiResponse<BannerResponse>>> Update(
        long id, [FromBody] UpdateBannerRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(long id, CancellationToken cancellationToken = default)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Success<object>(new { message = "Đã xóa." });
    }

    [HttpPatch("{id:long}/toggle")]
    public async Task<ActionResult<ApiResponse<object>>> ToggleActive(long id, CancellationToken cancellationToken = default)
    {
        var isActive = await _service.ToggleActiveAsync(id, cancellationToken);
        return Success<object>(new { isActive });
    }

    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<object>>> UploadImage(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
            throw new AppException(ErrorCode.BANNER_IMAGE_INVALID);

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new AppException(ErrorCode.BANNER_IMAGE_INVALID);

        if (file.Length > MaxFileBytes)
            throw new AppException(ErrorCode.BANNER_IMAGE_INVALID);

        await using var stream = file.OpenReadStream();
        var result = await _cloudinary.UploadAsync(stream, file.FileName, BannerFolder, cancellationToken);
        return Success<object>(new { imageUrl = result.Url, imagePublicId = result.PublicId });
    }
}
