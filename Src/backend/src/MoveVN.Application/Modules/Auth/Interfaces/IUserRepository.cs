using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IUserRepository
{
    Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    void Update(User user);
    Task<IList<string>> GetRolesAsync(long userId, CancellationToken cancellationToken = default);
    Task<IList<string>> GetPermissionCodesAsync(long userId, CancellationToken cancellationToken = default);
    Task AssignRoleAsync(long userId, int roleId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default);
    void Update(RefreshToken token);
    Task RevokeAllByUserAsync(long userId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
