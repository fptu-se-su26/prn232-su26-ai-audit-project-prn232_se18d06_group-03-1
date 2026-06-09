using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Infrastructure.Caching;
using StackExchange.Redis;

namespace MoveVN.Infrastructure.Services;

public class RedisTokenSessionService : ITokenSessionService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RedisTokenSessionService> _logger;
    private readonly Lazy<IConnectionMultiplexer?> _redis;

    public RedisTokenSessionService(IConfiguration configuration, ILogger<RedisTokenSessionService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _redis = new Lazy<IConnectionMultiplexer?>(CreateConnection);
    }

    public async Task StoreAsync(AuthUserResponse user, TokenResponse token, CancellationToken cancellationToken = default)
    {
        var redis = _redis.Value;
        if (redis is null || string.IsNullOrWhiteSpace(token.AccessTokenJti))
        {
            return;
        }

        var ttl = token.AccessTokenExpiresAt - DateTime.UtcNow;
        if (ttl <= TimeSpan.Zero)
        {
            return;
        }

        var session = new AccessTokenSession
        {
            Jti = token.AccessTokenJti,
            UserId = user.UserId,
            Email = user.Email,
            Roles = user.Roles.ToArray(),
            AccessToken = token.AccessToken,
            ExpiresAt = token.AccessTokenExpiresAt,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            await redis.GetDatabase().StringSetAsync(
                RedisKeys.Session(token.AccessTokenJti),
                JsonSerializer.Serialize(session),
                ttl);
        }
        catch (RedisException exception)
        {
            _logger.LogWarning(exception, "Redis is unavailable. Access token session was not cached.");
        }
    }

    public async Task<bool> IsActiveAsync(string jti, CancellationToken cancellationToken = default)
    {
        var redis = _redis.Value;
        if (redis is null)
        {
            return true;
        }

        try
        {
            return await redis.GetDatabase().KeyExistsAsync(RedisKeys.Session(jti));
        }
        catch (RedisException exception)
        {
            _logger.LogWarning(exception, "Redis is unavailable. Falling back to normal JWT validation.");
            return true;
        }
    }

    public async Task RevokeAsync(string jti, CancellationToken cancellationToken = default)
    {
        var redis = _redis.Value;
        if (redis is null)
        {
            return;
        }

        try
        {
            await redis.GetDatabase().KeyDeleteAsync(RedisKeys.Session(jti));
        }
        catch (RedisException exception)
        {
            _logger.LogWarning(exception, "Redis is unavailable. Token session revoke was skipped.");
        }
    }

    private IConnectionMultiplexer? CreateConnection()
    {
        var redisConnection = _configuration["REDIS_CONNECTION"];
        if (string.IsNullOrWhiteSpace(redisConnection))
        {
            return null;
        }

        try
        {
            var options = ConfigurationOptions.Parse(redisConnection);
            options.AbortOnConnectFail = false;
            return ConnectionMultiplexer.Connect(options);
        }
        catch (RedisException exception)
        {
            _logger.LogWarning(exception, "Redis connection failed. Auth will continue without access-token sessions.");
            return null;
        }
    }

    private sealed class AccessTokenSession
    {
        public string Jti { get; set; } = string.Empty;
        public long UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string[] Roles { get; set; } = [];
        public string AccessToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
