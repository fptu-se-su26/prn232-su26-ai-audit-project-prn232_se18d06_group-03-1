using MoveVN.Application.Modules.Users.DTOs;

namespace MoveVN.Application.Modules.Users.Interfaces;

public interface IPublicUserProfileService
{
    Task<PublicUserProfileResponse> GetProfileAsync(long userId, CancellationToken cancellationToken = default);
}
