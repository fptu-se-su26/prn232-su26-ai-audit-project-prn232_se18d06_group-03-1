namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IJwtTokenService
{
    Task<string> GenerateTokenAsync(Guid userId, string? email, IList<string> roles);
    Task<string> GenerateAccessTokenAsync(long userId, string? email, IList<string> roles);
    Task<string> GenerateEmailVerifyTokenAsync(long userId, string email);
    (long UserId, string Email)? ValidateEmailVerifyToken(string token);
    string GenerateRefreshToken();
}
