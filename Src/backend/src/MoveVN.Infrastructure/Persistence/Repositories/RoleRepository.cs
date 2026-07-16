using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly AppDbContext _context;

    public RoleRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Role?> GetByNameAsync(UserRoleType role, CancellationToken cancellationToken = default)
    {
        var roleName = role.ToString();
        return _context.Roles.FirstOrDefaultAsync(x => x.Name == roleName, cancellationToken);
    }

    public async Task<IList<string>> GetUserRoleNamesAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await (
            from userRole in _context.UserRoles
            join role in _context.Roles on userRole.RoleId equals role.Id
            where userRole.UserId == userId
            select role.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default)
    {
        await _context.UserRoles.AddAsync(userRole, cancellationToken);
    }

    public async Task RemoveUserRoleAsync(long userId, int roleId, CancellationToken cancellationToken = default)
    {
        var userRole = await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId, cancellationToken);

        if (userRole != null)
        {
            _context.UserRoles.Remove(userRole);
        }
    }
}
