using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/staff")]
public class StaffController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;

    public StaffController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AuthUserResponse>>> CreateStaff(
        CreateStaffRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.CreateStaffAsync(request, cancellationToken);
        return Success(result, "Staff account created successfully.");
    }
}
