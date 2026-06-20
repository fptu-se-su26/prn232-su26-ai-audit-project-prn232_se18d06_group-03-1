using Microsoft.AspNetCore.Authorization;
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
}
