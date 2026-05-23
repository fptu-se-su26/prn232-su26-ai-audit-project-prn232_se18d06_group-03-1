using MoveVN.Application.Modules.Users.DTOs;

namespace MoveVN.Application.Modules.Users.Interfaces;

public interface IUserService
{
    Task<UserResponse> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<UserResponse> GetCurrentProfileAsync(CancellationToken cancellationToken = default);

    Task<UserResponse> UpdateCurrentProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default);
}
