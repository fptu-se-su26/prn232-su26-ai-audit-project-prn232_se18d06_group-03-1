using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IJwtTokenService
{
    TokenResponse GenerateToken(long userId, string email, IList<string> roles, string refreshToken, DateTime refreshTokenExpiresAt);
}
