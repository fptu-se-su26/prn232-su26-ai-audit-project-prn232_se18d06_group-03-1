using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Disputes.DTOs;
using MoveVN.Application.Modules.Disputes.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/disputes")]
public class DisputesController : BaseApiController
{
    private readonly IDisputeService _disputeService;
    private readonly ICurrentUserContext _currentUser;
    private readonly ICloudinaryService _cloudinaryService;

    public DisputesController(
        IDisputeService disputeService,
        ICurrentUserContext currentUser,
        ICloudinaryService cloudinaryService)
    {
        _disputeService = disputeService;
        _currentUser = currentUser;
        _cloudinaryService = cloudinaryService;
    }

    [Authorize(Roles = "Customer,Owner")]
    [HttpPost("evidence-images")]
    [RequestSizeLimit(32 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<object>>> UploadEvidenceImages(
        [FromForm] List<IFormFile> images,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateEvidenceImages(images);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<object>.Failed("DISPUTE_9001", validationError));
        }

        var folder = $"movevn/disputes/{CurrentUserId()}/evidence";
        var urls = new List<string>(images.Count);
        foreach (var image in images)
        {
            await using var stream = image.OpenReadStream();
            var result = await _cloudinaryService.UploadAsync(stream, image.FileName, folder, cancellationToken);
            urls.Add(result.Url);
        }

        return Success<object>(new { urls }, "Evidence images uploaded.");
    }

    [Authorize(Roles = "Customer,Owner")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> Create(
        CreateDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.CreateAsync(request, CurrentUserId(), ActorRole(), cancellationToken);
        return Success(result, "Dispute created.");
    }

    [Authorize(Roles = "Customer,Owner")]
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResult<DisputeListItem>>>> GetMine(
        [FromQuery] DisputeListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.GetMineAsync(CurrentUserId(), request, cancellationToken);
        return Success(result);
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpGet("staff")]
    public async Task<ActionResult<ApiResponse<PagedResult<DisputeListItem>>>> GetStaffQueue(
        [FromQuery] DisputeListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.GetStaffQueueAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.GetByIdAsync(id, CurrentUserId(), IsStaffOrAdmin(), cancellationToken);
        return Success(result);
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPut("{id:long}/investigate")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> Investigate(long id, CancellationToken cancellationToken)
    {
        var result = await _disputeService.MarkInvestigatingAsync(id, CurrentUserId(), ActorRole(), cancellationToken);
        return Success(result, "Dispute moved to investigating.");
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPut("{id:long}/request-more-evidence")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> RequestMoreEvidence(
        long id,
        RequestMoreEvidenceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.RequestMoreEvidenceAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "Evidence requested.");
    }

    [Authorize(Roles = "Customer,Owner")]
    [HttpPut("{id:long}/evidence")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> AddEvidence(
        long id,
        AddDisputeEvidenceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.AddEvidenceAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "Evidence submitted.");
    }

    [Authorize(Roles = "Staff,Admin")]
    [HttpPut("{id:long}/resolve")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> Resolve(
        long id,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.ResolveAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "Dispute resolved.");
    }

    [Authorize(Roles = "Staff")]
    [HttpPut("{id:long}/escalate")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> Escalate(
        long id,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.EscalateAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "Dispute escalated.");
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:long}/admin-override")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> AdminOverride(
        long id,
        ResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.AdminOverrideAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "Admin override applied.");
    }

    [Authorize(Roles = "Customer,Owner")]
    [HttpPut("{id:long}/confirm-external-settlement")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> ConfirmExternalSettlement(
        long id,
        ConfirmExternalSettlementRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.ConfirmExternalSettlementAsync(id, CurrentUserId(), ActorRole(), request, cancellationToken);
        return Success(result, "External settlement confirmed.");
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:long}/admin-close")]
    public async Task<ActionResult<ApiResponse<DisputeDetailResponse>>> AdminClose(
        long id,
        AdminCloseDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _disputeService.AdminCloseAsync(id, CurrentUserId(), request, cancellationToken);
        return Success(result, "Dispute closed by admin.");
    }

    private long CurrentUserId()
        => _currentUser.UserId!.Value;

    private bool IsStaffOrAdmin()
        => User.IsInRole("Staff") || User.IsInRole("Admin");

    private string ActorRole()
    {
        if (User.IsInRole("Admin")) return "Admin";
        if (User.IsInRole("Staff")) return "Staff";
        if (User.IsInRole("Owner")) return "Owner";
        return "Customer";
    }

    private static string? ValidateEvidenceImages(List<IFormFile>? images)
    {
        if (images is null || images.Count == 0) return "Vui lòng chọn ít nhất 1 ảnh bằng chứng.";
        if (images.Count > 6) return "Chỉ được tải tối đa 6 ảnh bằng chứng mỗi lần.";

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        const int maxSize = 5 * 1024 * 1024;
        foreach (var image in images)
        {
            if (image.Length == 0) return "Ảnh bằng chứng không được rỗng.";
            if (image.Length > maxSize) return "Mỗi ảnh bằng chứng phải dưới 5MB.";
            if (!allowedExtensions.Contains(Path.GetExtension(image.FileName).ToLowerInvariant()))
            {
                return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.";
            }
        }

        return null;
    }
}
