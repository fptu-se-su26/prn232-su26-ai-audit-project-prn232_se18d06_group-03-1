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

    public long? DomainUserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var domainUserId = user?.FindFirstValue("domainUserId");
            return long.TryParse(domainUserId, out var parsed) ? parsed : null;
        }
    }

    public string? Email
    {
        get
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email)
                ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue(JwtRegisteredClaimNames.Email);
        }
    }

    public IList<string> Roles
    {
        get
        {
            return _httpContextAccessor.HttpContext?.User?.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList() ?? new List<string>();
        }
    }
}
