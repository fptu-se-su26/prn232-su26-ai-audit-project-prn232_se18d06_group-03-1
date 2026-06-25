using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Infrastructure.Caching;

namespace MoveVN.Infrastructure.Services;

public class RedisPresenceService : IPresenceService
{
    private const string HttpClientName = "UpstashRedis";
    private const int OnlineTtlSeconds = 90;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RedisPresenceService> _logger;

    public RedisPresenceService(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<RedisPresenceService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task MarkOnlineAsync(long userId, string connectionId, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        var payload = JsonSerializer.Serialize(new OnlinePresence
        {
            UserId = userId,
            ConnectionId = connectionId,
            LastHeartbeatAt = DateTime.UtcNow
        });

        try
        {
            await SendCommandAsync(["SET", RedisKeys.Online(userId), payload, "EX", OnlineTtlSeconds], cancellationToken);
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Online presence was not stored.");
        }
    }

    public async Task RefreshOnlineAsync(long userId, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        try
        {
            await SendCommandAsync(["EXPIRE", RedisKeys.Online(userId), OnlineTtlSeconds], cancellationToken);
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Online presence was not refreshed.");
        }
    }

    public async Task MarkOfflineAsync(long userId, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        try
        {
            await SendCommandAsync(["DEL", RedisKeys.Online(userId)], cancellationToken);
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Online presence was not removed.");
        }
    }

    public async Task<IReadOnlyDictionary<long, bool>> GetOnlineStatusesAsync(
        IEnumerable<long> userIds,
        CancellationToken cancellationToken = default)
    {
        var distinctUserIds = userIds.Distinct().ToArray();
        var statuses = distinctUserIds.ToDictionary(userId => userId, _ => false);

        if (!IsConfigured() || distinctUserIds.Length == 0)
        {
            return statuses;
        }

        try
        {
            var command = new object[distinctUserIds.Length + 1];
            command[0] = "MGET";
            for (var index = 0; index < distinctUserIds.Length; index++)
            {
                command[index + 1] = RedisKeys.Online(distinctUserIds[index]);
            }

            var result = await SendCommandAsync(command, cancellationToken);
            if (result.ValueKind != JsonValueKind.Array)
            {
                return statuses;
            }

            var resultIndex = 0;
            foreach (var item in result.EnumerateArray())
            {
                statuses[distinctUserIds[resultIndex]] = item.ValueKind != JsonValueKind.Null;
                resultIndex++;
            }
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Falling back to database presence.");
        }

        return statuses;
    }

    private bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_URL"])
            && !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_TOKEN"]);
    }

    private async Task<JsonElement> SendCommandAsync(object[] command, CancellationToken cancellationToken)
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

    private static bool IsUpstashFailure(Exception exception, CancellationToken cancellationToken)
    {
        return exception is HttpRequestException
            or JsonException
            or InvalidOperationException
            || exception is TaskCanceledException && !cancellationToken.IsCancellationRequested;
    }

    private sealed class OnlinePresence
    {
        public long UserId { get; set; }
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime LastHeartbeatAt { get; set; }
    }
}
