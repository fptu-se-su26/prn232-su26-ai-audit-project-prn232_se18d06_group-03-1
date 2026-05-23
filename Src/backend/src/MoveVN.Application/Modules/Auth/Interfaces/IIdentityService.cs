using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Users.DTOs;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IIdentityService
{
    Task<AuthUserResponse?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<AuthUserResponse?> FindByIdAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<AuthUserResponse> CreateUserAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task<bool> CheckPasswordAsync(Guid userId, string password, CancellationToken cancellationToken = default);

    Task<UserResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
}
