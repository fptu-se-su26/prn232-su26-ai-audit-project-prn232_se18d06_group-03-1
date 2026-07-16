using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/owners")]
public class OwnersController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;

    public OwnersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AuthUserResponse>>> CreateOwner(
        [FromForm] AdminCreateOwnerForm request,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.CreateOwnerAsync(new AdminCreateOwnerRequest
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Password = request.Password,
            ConfirmPassword = request.ConfirmPassword,
            UseOcr = request.UseOcr,
            NationalId = request.NationalId,
            DateOfBirth = request.DateOfBirth,
            Address = request.Address,
            NationalIdFrontImage = await ToDocumentAsync(request.NationalIdFrontImage, cancellationToken),
            DriverLicenseNumber = request.DriverLicenseNumber,
            DriverLicenseClass = request.DriverLicenseClass,
            DriverLicenseVehicleType = request.DriverLicenseVehicleType,
            DriverLicenseFrontImage = await ToDocumentAsync(request.DriverLicenseFrontImage, cancellationToken),
            BankName = request.BankName,
            BankAccountNumber = request.BankAccountNumber,
            BankAccountHolderName = request.BankAccountHolderName
        }, cancellationToken);
        return Success(result, "Owner account created successfully.");
    }

    [HttpPost("ocr-preview")]
    public async Task<ActionResult<ApiResponse<AdminOwnerOcrPreviewResponse>>> PreviewOcr(
        [FromForm] AdminOwnerOcrPreviewForm request,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.PreviewOwnerDocumentsAsync(new AdminOwnerOcrPreviewRequest
        {
            FullName = request.FullName,
            NationalIdFrontImage = request.NationalIdFrontImage is null
                ? null
                : await ToDocumentAsync(request.NationalIdFrontImage, cancellationToken),
            DriverLicenseFrontImage = request.DriverLicenseFrontImage is null
                ? null
                : await ToDocumentAsync(request.DriverLicenseFrontImage, cancellationToken)
        }, cancellationToken);

        return Success(result, "OCR processed. Please review the extracted information.");
    }

    private static async Task<AdminDocumentFile> ToDocumentAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null)
        {
            return new AdminDocumentFile();
        }

        await using var stream = file.OpenReadStream();
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory, cancellationToken);
        return new AdminDocumentFile { FileName = file.FileName, Content = memory.ToArray() };
    }
}

public sealed class AdminCreateOwnerForm
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public bool UseOcr { get; set; }
    public string NationalId { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public IFormFile NationalIdFrontImage { get; set; } = null!;
    public string DriverLicenseNumber { get; set; } = string.Empty;
    public string DriverLicenseClass { get; set; } = string.Empty;
    public string DriverLicenseVehicleType { get; set; } = string.Empty;
    public IFormFile DriverLicenseFrontImage { get; set; } = null!;
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolderName { get; set; } = string.Empty;
}

public sealed class AdminOwnerOcrPreviewForm
{
    public string FullName { get; set; } = string.Empty;
    public IFormFile? NationalIdFrontImage { get; set; }
    public IFormFile? DriverLicenseFrontImage { get; set; }
}
