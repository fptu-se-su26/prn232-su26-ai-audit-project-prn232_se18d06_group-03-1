using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;

namespace MoveVN.Application.Modules.Users.Services;

public class UserService : IUserService
{
    private readonly IIdentityService _identityService;
    private readonly ICurrentUserContext _currentUserContext;

    public UserService(IIdentityService identityService, ICurrentUserContext currentUserContext)
    {
        _identityService = identityService;
        _currentUserContext = currentUserContext;
    }

    public async Task<UserResponse> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _identityService.FindByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User was not found.");

        return new UserResponse
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email
        };
    }

    public async Task<UserResponse> GetCurrentProfileAsync(CancellationToken cancellationToken = default)
    {
        if (_currentUserContext.UserId is not { } userId)
        {
            throw new ValidationException(new[] { "Invalid user id claim." });
        }

        return await GetByIdAsync(userId, cancellationToken);
    }

    public async Task<UserResponse> UpdateCurrentProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        if (_currentUserContext.UserId is not { } userId)
        {
            throw new ValidationException(new[] { "Invalid user id claim." });
        }

        return await _identityService.UpdateProfileAsync(userId, request, cancellationToken);
    }
}
