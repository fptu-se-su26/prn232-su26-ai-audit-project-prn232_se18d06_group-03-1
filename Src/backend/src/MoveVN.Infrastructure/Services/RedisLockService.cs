using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class RedisLockService : IRedisLockService
{
    private const string HttpClientName = "UpstashRedis";
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RedisLockService> _logger;

    public RedisLockService(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<RedisLockService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<RedisLock?> AcquireLockAsync(string lockKey, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return null;
        }

        var lockValue = Guid.NewGuid().ToString("N");
        var expirySeconds = Math.Max(1, (long)Math.Ceiling(expiry.TotalSeconds));

        try
        {
            var result = await SendCommandAsync(
                ["SET", lockKey, lockValue, "NX", "EX", expirySeconds],
                cancellationToken);

            if (result.ValueKind == JsonValueKind.String && result.GetString() == "OK")
            {
                return new RedisLock(lockKey, lockValue, DateTime.UtcNow);
            }

            return null;
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Lock was not acquired.");
            return null;
        }
    }

    public async Task ReleaseLockAsync(RedisLock lockObj, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        try
        {
            var luaScript = """
                if redis.call("GET", KEYS[1]) == ARGV[1] then
                    return redis.call("DEL", KEYS[1])
                else
                    return 0
                end
                """;

            await SendCommandAsync(
                ["EVAL", luaScript, "1", lockObj.Key, lockObj.Value],
                cancellationToken);
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Lock release was skipped.");
        }
    }

    private bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_URL"])
            && !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_TOKEN"]);
    }

    private async Task<JsonElement> SendCommandAsync(
        object[] command,
        CancellationToken cancellationToken)
    {
        var restUrl = _configuration["UPSTASH_REDIS_REST_URL"]
            ?? throw new InvalidOperationException("UPSTASH_REDIS_REST_URL is not configured.");
        var restToken = _configuration["UPSTASH_REDIS_REST_TOKEN"]
            ?? throw new InvalidOperationException("UPSTASH_REDIS_REST_TOKEN is not configured.");

        using var request = new HttpRequestMessage(HttpMethod.Post, restUrl.TrimEnd('/'))
        {
            Content = JsonContent.Create(command)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", restToken);

        var client = _httpClientFactory.CreateClient(HttpClientName);
        using var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var payload = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);

        if (!payload.RootElement.TryGetProperty("result", out var result))
        {
            throw new JsonException("Upstash Redis response does not contain a result.");
        }

        return result.Clone();
    }

    private static bool IsUpstashFailure(
        Exception exception,
        CancellationToken cancellationToken)
    {
        return exception is HttpRequestException
            or JsonException
            or InvalidOperationException
            || exception is TaskCanceledException && !cancellationToken.IsCancellationRequested;
    }
}
