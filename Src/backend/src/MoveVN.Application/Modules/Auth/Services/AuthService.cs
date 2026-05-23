using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Application.Modules.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IIdentityService _identityService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ICurrentUserContext _currentUserContext;

    public AuthService(
        IIdentityService identityService,
        IJwtTokenService jwtTokenService,
        ICurrentUserContext currentUserContext)
    {
        _identityService = identityService;
        _jwtTokenService = jwtTokenService;
        _currentUserContext = currentUserContext;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _identityService.FindByEmailAsync(request.Email, cancellationToken);
        if (existingUser is not null)
        {
            throw new ValidationException(new[] { "Email is already registered." });
        }

        var user = await _identityService.CreateUserAsync(request, cancellationToken);
        return await CreateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _identityService.FindByEmailAsync(request.Email, cancellationToken);
        if (user is null || !await _identityService.CheckPasswordAsync(user.UserId, request.Password, cancellationToken))
        {
            throw new ValidationException(new[] { "Email or password is incorrect." });
        }

        return await CreateAuthResponseAsync(user);
    }

    public async Task<AuthUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (_currentUserContext.UserId is not { } userId)
        {
            throw new ValidationException(new[] { "Invalid user id claim." });
        }

        return await _identityService.FindByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User was not found.");
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(AuthUserResponse user)
    {
        var token = await _jwtTokenService.GenerateTokenAsync(user.UserId, user.Email, user.Roles);

        return new AuthResponse
        {
            Token = token,
            User = user
        };
    }
}
