using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Infrastructure.Services;

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _context;

    public PermissionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IList<string>> GetPermissionsAsync(long userId, CancellationToken cancellationToken = default)
    {
        var roles = await _context.UserRoles
            .Where(x => x.UserId == userId)
            .Select(x => x.RoleId)
            .ToListAsync(cancellationToken);

        var rolePermissions = await _context.RolePermissions
            .Where(x => roles.Contains(x.RoleId))
            .Join(_context.Permissions, x => x.PermissionId, p => p.Id, (_, p) => p.Code)
            .ToListAsync(cancellationToken);

        var directPermissions = await _context.StaffPermissions
            .Where(x => x.UserId == userId)
            .Select(x => x.PermissionCode)
            .ToListAsync(cancellationToken);

        return rolePermissions
            .Concat(directPermissions)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<bool> HasPermissionAsync(long userId, string permissionCode, CancellationToken cancellationToken = default)
    {
        var permissions = await GetPermissionsAsync(userId, cancellationToken);
        return permissions.Contains(permissionCode, StringComparer.OrdinalIgnoreCase);
    }
}
