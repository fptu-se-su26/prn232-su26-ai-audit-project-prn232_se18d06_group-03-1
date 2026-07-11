using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Infrastructure.Caching;

namespace MoveVN.Infrastructure.Services;

public class RedisVehicleDocumentUploadAttemptLimiter : IVehicleDocumentUploadAttemptLimiter
{
    private const string HttpClientName = "UpstashRedis";
    private const int MaxConsecutiveFailures = 3;
    private const int MaxDailyFailures = 6;
    private const int ConsecutiveLockSeconds = 30 * 60;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RedisVehicleDocumentUploadAttemptLimiter> _logger;

    public RedisVehicleDocumentUploadAttemptLimiter(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<RedisVehicleDocumentUploadAttemptLimiter> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<VehicleDocumentUploadAttemptState> GetStateAsync(long ownerId, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return new VehicleDocumentUploadAttemptState();
        }

        try
        {
            var lockTtl = await GetTtlAsync(RedisKeys.VehicleDocumentUploadLock(ownerId), cancellationToken);
            return new VehicleDocumentUploadAttemptState
            {
                LockedUntil = lockTtl > 0 ? DateTime.UtcNow.AddSeconds(lockTtl) : null,
                ConsecutiveFailures = await GetIntAsync(RedisKeys.VehicleDocumentUploadConsecutiveFailures(ownerId), cancellationToken),
                DailyFailures = await GetIntAsync(RedisKeys.VehicleDocumentUploadDailyFailures(ownerId, DateKey()), cancellationToken)
            };
        }
        catch (Exception exception) when (IsRedisFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Vehicle document upload limiter is open.");
            return new VehicleDocumentUploadAttemptState();
        }
    }

    public async Task RegisterFailureAsync(long ownerId, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        try
        {
            var consecutiveKey = RedisKeys.VehicleDocumentUploadConsecutiveFailures(ownerId);
            var dailyKey = RedisKeys.VehicleDocumentUploadDailyFailures(ownerId, DateKey());
            var expiresIn = SecondsUntilTomorrowUtc();
            var consecutive = await IncrementAsync(consecutiveKey, cancellationToken);
            var daily = await IncrementAsync(dailyKey, cancellationToken);

            await SendCommandAsync(["EXPIRE", consecutiveKey, expiresIn], cancellationToken);
            await SendCommandAsync(["EXPIRE", dailyKey, expiresIn], cancellationToken);

            if (daily >= MaxDailyFailures)
            {
                await SendCommandAsync(
                    ["SET", RedisKeys.VehicleDocumentUploadLock(ownerId), "daily-limit", "EX", expiresIn],
                    cancellationToken);
            }
            else if (consecutive >= MaxConsecutiveFailures)
            {
                await SendCommandAsync(
                    ["SET", RedisKeys.VehicleDocumentUploadLock(ownerId), "consecutive-limit", "EX", ConsecutiveLockSeconds],
                    cancellationToken);
            }
        }
        catch (Exception exception) when (IsRedisFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Vehicle document upload failure was not counted.");
        }
    }

    public async Task RegisterAcceptedAsync(long ownerId, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        try
        {
            await SendCommandAsync(
                [
                    "DEL",
                    RedisKeys.VehicleDocumentUploadConsecutiveFailures(ownerId),
                    RedisKeys.VehicleDocumentUploadLock(ownerId)
                ],
                cancellationToken);
        }
        catch (Exception exception) when (IsRedisFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Vehicle document accepted state was not stored.");
        }
    }

    private async Task<int> GetIntAsync(string key, CancellationToken cancellationToken)
    {
        var result = await SendCommandAsync(["GET", key], cancellationToken);
        if (result.ValueKind == JsonValueKind.String && int.TryParse(result.GetString(), out var value))
        {
            return value;
        }

        return result.ValueKind == JsonValueKind.Number && result.TryGetInt32(out var number) ? number : 0;
    }

    private async Task<int> GetTtlAsync(string key, CancellationToken cancellationToken)
    {
        var result = await SendCommandAsync(["TTL", key], cancellationToken);
        return result.ValueKind == JsonValueKind.Number && result.TryGetInt32(out var ttl) ? ttl : -2;
    }

    private async Task<int> IncrementAsync(string key, CancellationToken cancellationToken)
    {
        var result = await SendCommandAsync(["INCR", key], cancellationToken);
        return result.ValueKind == JsonValueKind.Number && result.TryGetInt32(out var value) ? value : 0;
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

    private static string DateKey() => DateTime.UtcNow.ToString("yyyyMMdd");

    private static int SecondsUntilTomorrowUtc()
    {
        return Math.Max(1, (int)Math.Ceiling((DateTime.UtcNow.Date.AddDays(1) - DateTime.UtcNow).TotalSeconds));
    }

    private static bool IsRedisFailure(Exception exception, CancellationToken cancellationToken)
    {
        return exception is HttpRequestException
            or JsonException
            or InvalidOperationException
            || exception is TaskCanceledException && !cancellationToken.IsCancellationRequested;
    }
}
