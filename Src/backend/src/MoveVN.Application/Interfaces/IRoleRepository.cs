using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;

namespace MoveVN.Application.Interfaces;

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(UserRoleType role, CancellationToken cancellationToken = default);
    Task<IList<string>> GetUserRoleNamesAsync(long userId, CancellationToken cancellationToken = default);
    Task AddUserRoleAsync(UserRole userRole, CancellationToken cancellationToken = default);
    Task RemoveUserRoleAsync(long userId, int roleId, CancellationToken cancellationToken = default);
}
