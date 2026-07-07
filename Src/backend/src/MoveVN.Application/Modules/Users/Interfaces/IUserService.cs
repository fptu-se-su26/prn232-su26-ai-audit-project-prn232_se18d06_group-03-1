using MoveVN.Application.Modules.Users.DTOs;

namespace MoveVN.Application.Modules.Users.Interfaces;

public interface IUserService
{
    Task<UserResponse> GetByIdAsync(long userId, CancellationToken cancellationToken = default);

    Task<UserResponse> GetCurrentProfileAsync(CancellationToken cancellationToken = default);

    Task<UserResponse> UpdateCurrentProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default);

    Task<string> UploadAvatarAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
}
