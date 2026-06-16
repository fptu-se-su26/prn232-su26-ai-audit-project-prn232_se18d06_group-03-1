using Microsoft.Extensions.Caching.Memory;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MoveVN.Infrastructure.Services;

public class RateLimitService : IRateLimitService
{
    private const int MaxAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly IMemoryCache _cache;
    private readonly AppDbContext _context;

    public RateLimitService(IMemoryCache cache, AppDbContext context)
    {
        _cache = cache;
        _context = context;
    }

    public async Task<bool> IsLoginLockedAsync(string email, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue($"login_attempts_{email}", out int attempts) && attempts >= MaxAttempts)
            return true;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        return user?.Status == "Locked";
    }

    public Task<int> RecordLoginFailAsync(string email, CancellationToken cancellationToken = default)
    {
        var key = $"login_attempts_{email}";
        var attempts = _cache.TryGetValue(key, out int cached) ? cached : 0;
        attempts++;

        _cache.Set(key, attempts, LockoutDuration);

        return Task.FromResult(MaxAttempts - attempts);
    }

    public Task ResetLoginAttemptsAsync(string email, CancellationToken cancellationToken = default)
    {
        _cache.Remove($"login_attempts_{email}");
        return Task.CompletedTask;
    }
}
