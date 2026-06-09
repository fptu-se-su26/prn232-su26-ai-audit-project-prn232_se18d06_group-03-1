using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface ITokenSessionService
{
    Task StoreAsync(AuthUserResponse user, TokenResponse token, CancellationToken cancellationToken = default);
    Task<bool> IsActiveAsync(string jti, CancellationToken cancellationToken = default);
    Task RevokeAsync(string jti, CancellationToken cancellationToken = default);
}
