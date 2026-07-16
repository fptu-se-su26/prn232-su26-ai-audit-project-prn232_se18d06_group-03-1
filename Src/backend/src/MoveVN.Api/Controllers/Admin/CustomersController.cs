using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Admin.Interfaces;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/customers")]
public sealed class CustomersController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;

    public CustomersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AuthUserResponse>>> CreateCustomer(
        AdminCreateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminUserService.CreateCustomerAsync(request, cancellationToken);
        return Success(result, "Customer account created successfully.");
    }
}
