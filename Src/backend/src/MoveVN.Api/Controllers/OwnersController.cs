using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Owner.DTOs;
using MoveVN.Application.Modules.Owner.Interfaces;

namespace MoveVN.Api.Controllers;

[Route("api/owner-onboarding")]
public class OwnersController : BaseApiController
{
    private readonly IOwnerApplicationService _ownerApplicationService;

    public OwnersController(IOwnerApplicationService ownerApplicationService)
    {
        _ownerApplicationService = ownerApplicationService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<OwnerOnboardingRegisterResponse>>> Register(
        OwnerOnboardingRegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _ownerApplicationService.RegisterOwnerOnboardingAsync(request, cancellationToken);
        return Success(result, "Registered successfully. Please verify email.");
    }
}
