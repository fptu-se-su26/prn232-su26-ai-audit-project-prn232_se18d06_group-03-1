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
        AdminCreateOwnerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.CreateOwnerAsync(request, cancellationToken);
        return Success(result, "Owner account created successfully.");
    }
}
