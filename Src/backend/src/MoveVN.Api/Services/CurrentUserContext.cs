using MoveVN.Application.Modules.Auth.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MoveVN.Api.Services;

public class CurrentUserContext : ICurrentUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public long? UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userId = user?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user?.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return long.TryParse(userId, out var parsedUserId) ? parsedUserId : null;
        }
    }
}
