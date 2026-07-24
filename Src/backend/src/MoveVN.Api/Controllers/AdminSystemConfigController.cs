using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.SystemConfigs.DTOs;
using MoveVN.Application.Modules.SystemConfigs.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin/config")]
public class AdminSystemConfigController : BaseApiController
{
    private readonly ISystemConfigService _systemConfigService;
    private readonly ICurrentUserContext _currentUser;

    public AdminSystemConfigController(ISystemConfigService systemConfigService, ICurrentUserContext currentUser)
    {
        _systemConfigService = systemConfigService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SystemConfigResponse>>>> GetAll(CancellationToken cancellationToken)
        => Success(await _systemConfigService.GetAllAsync(cancellationToken));

    [HttpPut]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SystemConfigResponse>>>> Update(
        UpdateSystemConfigRequest request,
        CancellationToken cancellationToken)
        => Success(await _systemConfigService.UpdateAsync(request, _currentUser.UserId, cancellationToken), "System config updated.");
}
