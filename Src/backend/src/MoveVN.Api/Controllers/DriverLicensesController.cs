using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenses.DTOs;
using MoveVN.Application.Modules.DriverLicenses.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/driver-licenses")]
public class DriverLicensesController : BaseApiController
{
    private readonly IDriverLicenseService _driverLicenseService;

    public DriverLicensesController(IDriverLicenseService driverLicenseService)
    {
        _driverLicenseService = driverLicenseService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<DriverLicenseStatusResponse>>> GetCurrent(CancellationToken cancellationToken)
    {
        var result = await _driverLicenseService.GetCurrentAsync(cancellationToken);
        return Success(result);
    }

    [HttpPost("me/verification")]
    public async Task<ActionResult<ApiResponse<DriverLicenseSubmitResponse>>> Submit(
        IFormFile frontImage,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateImage(frontImage);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<DriverLicenseSubmitResponse>.Failed(ErrorCode.DRIVER_LICENSE_FILE_INVALID.Code, validationError));
        }

        await using var stream = frontImage.OpenReadStream();
        var result = await _driverLicenseService.SubmitAsync(stream, frontImage.FileName, cancellationToken);
        return Success(result, result.Message ?? "Driver license verification processed.");
    }

    private static string? ValidateImage(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return "Vui lòng upload ảnh GPLX.";
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowedExtensions.Contains(extension))
        {
            return "Chỉ chấp nhận file JPG, PNG hoặc WebP.";
        }

        const int maxSize = 5 * 1024 * 1024;
        return file.Length > maxSize ? "Kích thước file tối đa là 5MB." : null;
    }
}
