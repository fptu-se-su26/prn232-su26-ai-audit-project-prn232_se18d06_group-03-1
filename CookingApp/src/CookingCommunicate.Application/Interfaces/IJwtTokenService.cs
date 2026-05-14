namespace CookingCommunicate.Application.Interfaces;

public interface IJwtTokenService
{
    Task<string> GenerateTokenAsync(Guid userId, string? email, IList<string> roles);
}
