using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/posts")]
public class PostManagementController : BaseApiController
{
    private readonly IAdminPostManagementService _postManagementService;
    private readonly ICurrentUserContext _currentUser;

    public PostManagementController(IAdminPostManagementService postManagementService, ICurrentUserContext currentUser)
    {
        _postManagementService = postManagementService;
        _currentUser = currentUser;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<AdminPostStatsResponse>>> GetStats(CancellationToken cancellationToken = default)
    {
        var result = await _postManagementService.GetPostStatsAsync(cancellationToken);
        return Success(result);
    }

    [HttpPost("ocr-preview")]
    public async Task<ActionResult<ApiResponse<AdminVehicleOcrPreviewResponse>>> PreviewOcr(
        [FromForm] AdminVehicleOcrPreviewForm request,
        CancellationToken cancellationToken)
    {
        var result = await _postManagementService.PreviewVehicleOcrAsync(new AdminVehicleOcrPreviewRequest
        {
            CavetImage = request.CavetImage is null
                ? null
                : await ToDocumentAsync(request.CavetImage, cancellationToken),
            ExpectedLicensePlate = request.ExpectedLicensePlate,
            ExpectedBrand = request.ExpectedBrand,
            ExpectedModel = request.ExpectedModel,
            VehicleType = request.VehicleType
        }, cancellationToken);
        return Success(result);
    }

    [HttpPost("vehicles")]
    public async Task<ActionResult<ApiResponse<VehicleResponse>>> CreateVehicle(
        [FromBody] CreateAdminVehicleRequest request,
        CancellationToken cancellationToken)
    {
        var adminUserId = _currentUser.UserId!.Value;
        var result = await _postManagementService.CreateVehicleAsync(request, adminUserId, cancellationToken);
        return Success(result, "Vehicle created successfully.");
    }

    [HttpGet("owners")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminOwnerListItem>>>> GetOwners(
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _postManagementService.GetOwnersWithVehiclesAsync(keyword, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("owners/{ownerId}/vehicles")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminOwnerVehicleListItem>>>> GetOwnerVehicles(
        long ownerId,
        [FromQuery] string? vehicleType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _postManagementService.GetOwnerVehiclesAsync(ownerId, vehicleType, page, pageSize, cancellationToken);
        return Success(result);
    }

    private static async Task<AdminDocumentFile> ToDocumentAsync(IFormFile file, CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory, cancellationToken);
        return new AdminDocumentFile { FileName = file.FileName, Content = memory.ToArray() };
    }
}

public sealed class AdminVehicleOcrPreviewForm
{
    public IFormFile? CavetImage { get; set; }
    public string? ExpectedLicensePlate { get; set; }
    public string? ExpectedBrand { get; set; }
    public string? ExpectedModel { get; set; }
    public string VehicleType { get; set; } = string.Empty;
}
