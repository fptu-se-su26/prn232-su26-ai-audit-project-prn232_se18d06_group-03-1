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
    private static readonly TimeSpan RetryInterval = TimeSpan.FromSeconds(30);
    private readonly IConfiguration _configuration;
    private readonly ILogger<RedisTokenSessionService> _logger;
    private readonly SemaphoreSlim _connectionLock = new(1, 1);
    private IConnectionMultiplexer? _redis;
    private DateTime _nextConnectionAttemptAt = DateTime.MinValue;

    public RedisTokenSessionService(IConfiguration configuration, ILogger<RedisTokenSessionService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task StoreAsync(AuthUserResponse user, TokenResponse token, CancellationToken cancellationToken = default)
    {
        var redis = await GetConnectionAsync(cancellationToken);
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
        var redis = await GetConnectionAsync(cancellationToken);
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
        var redis = await GetConnectionAsync(cancellationToken);
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

    private async Task<IConnectionMultiplexer?> GetConnectionAsync(CancellationToken cancellationToken)
    {
        if (_redis?.IsConnected == true)
        {
            return _redis;
        }

        if (DateTime.UtcNow < _nextConnectionAttemptAt)
        {
            return null;
        }

        var redisConnection = _configuration["REDIS_CONNECTION"];
        if (string.IsNullOrWhiteSpace(redisConnection))
        {
            return null;
        }

        await _connectionLock.WaitAsync(cancellationToken);
        try
        {
            if (_redis?.IsConnected == true)
            {
                return _redis;
            }

            if (DateTime.UtcNow < _nextConnectionAttemptAt)
            {
                return null;
            }

            var options = ConfigurationOptions.Parse(redisConnection);
            options.AbortOnConnectFail = true;
            options.ConnectTimeout = 1000;
            options.SyncTimeout = 1000;
            options.AsyncTimeout = 1000;
            options.ConnectRetry = 1;

            _redis?.Dispose();
            _redis = await ConnectionMultiplexer.ConnectAsync(options);
            return _redis;
        }
        catch (RedisException exception)
        {
            _nextConnectionAttemptAt = DateTime.UtcNow.Add(RetryInterval);
            _logger.LogWarning("Redis connection failed. Auth will continue without token sessions and retry after {RetrySeconds} seconds. Reason: {Message}", RetryInterval.TotalSeconds, exception.Message);
            return null;
        }
        finally
        {
            _connectionLock.Release();
        }
    }

    private sealed class AccessTokenSession
    {
        public string Jti { get; set; } = string.Empty;
        public long UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string[] Roles { get; set; } = [];
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
