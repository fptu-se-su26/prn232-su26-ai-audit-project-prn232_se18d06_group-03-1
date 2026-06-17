using Microsoft.AspNetCore.Authorization;
using MoveVN.Api.Services;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Api.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IPermissionService _permissionService;

    public PermissionAuthorizationHandler(ICurrentUserContext currentUserContext, IPermissionService permissionService)
    {
        _currentUserContext = currentUserContext;
        _permissionService = permissionService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (context.User.IsInRole("Admin"))
        {
            context.Succeed(requirement);
            return;
        }

        var userId = _currentUserContext.DomainUserId;
        if (userId is null)
            return;

        if (await _permissionService.HasPermissionAsync(userId.Value, requirement.PermissionCode))
            context.Succeed(requirement);
    }
}
