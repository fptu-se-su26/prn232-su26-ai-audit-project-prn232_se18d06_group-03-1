namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IJwtTokenService
{
    Task<string> GenerateTokenAsync(Guid userId, string? email, IList<string> roles);
}
