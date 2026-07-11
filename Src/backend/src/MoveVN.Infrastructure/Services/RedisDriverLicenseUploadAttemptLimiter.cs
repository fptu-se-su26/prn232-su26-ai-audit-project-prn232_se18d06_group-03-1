using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Infrastructure.Caching;

namespace MoveVN.Infrastructure.Services;

public class RedisDriverLicenseUploadAttemptLimiter : IDriverLicenseUploadAttemptLimiter
{
    private const string HttpClientName = "UpstashRedis";
    private const int MaxConsecutiveFailures = 3;
    private const int MaxDailyFailures = 6;
    private const int ConsecutiveLockSeconds = 30 * 60;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RedisDriverLicenseUploadAttemptLimiter> _logger;

    public RedisDriverLicenseUploadAttemptLimiter(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<RedisDriverLicenseUploadAttemptLimiter> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<DriverLicenseUploadAttemptState> GetStateAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return new DriverLicenseUploadAttemptState();
        }

        try
        {
            var normalizedVehicleType = NormalizeVehicleType(vehicleType);
            var lockKey = RedisKeys.DriverLicenseUploadLock(userId, normalizedVehicleType);
            var consecutiveKey = RedisKeys.DriverLicenseUploadConsecutiveFailures(userId, normalizedVehicleType);
            var dailyKey = RedisKeys.DriverLicenseUploadDailyFailures(userId, normalizedVehicleType, DateKey());

            var lockTtl = await GetTtlAsync(lockKey, cancellationToken);
            return new DriverLicenseUploadAttemptState
            {
                LockedUntil = lockTtl > 0 ? DateTime.UtcNow.AddSeconds(lockTtl) : null,
                ConsecutiveFailures = await GetIntAsync(consecutiveKey, cancellationToken),
                DailyFailures = await GetIntAsync(dailyKey, cancellationToken)
            };
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Driver license upload limiter is open.");
            return new DriverLicenseUploadAttemptState();
        }
    }

    public async Task RegisterFailureAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        try
        {
            var normalizedVehicleType = NormalizeVehicleType(vehicleType);
            var consecutiveKey = RedisKeys.DriverLicenseUploadConsecutiveFailures(userId, normalizedVehicleType);
            var dailyKey = RedisKeys.DriverLicenseUploadDailyFailures(userId, normalizedVehicleType, DateKey());

            var consecutive = await IncrementAsync(consecutiveKey, cancellationToken);
            var daily = await IncrementAsync(dailyKey, cancellationToken);
            await SendCommandAsync(["EXPIRE", consecutiveKey, SecondsUntilTomorrowUtc()], cancellationToken);
            await SendCommandAsync(["EXPIRE", dailyKey, SecondsUntilTomorrowUtc()], cancellationToken);

            if (daily >= MaxDailyFailures)
            {
                await SendCommandAsync(
                    ["SET", RedisKeys.DriverLicenseUploadLock(userId, normalizedVehicleType), "daily-limit", "EX", SecondsUntilTomorrowUtc()],
                    cancellationToken);
            }
            else if (consecutive >= MaxConsecutiveFailures)
            {
                await SendCommandAsync(
                    ["SET", RedisKeys.DriverLicenseUploadLock(userId, normalizedVehicleType), "consecutive-limit", "EX", ConsecutiveLockSeconds],
                    cancellationToken);
            }
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Driver license upload failure was not counted.");
        }
    }

    public async Task RegisterAcceptedAsync(long userId, string vehicleType, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        try
        {
            var normalizedVehicleType = NormalizeVehicleType(vehicleType);
            await SendCommandAsync(
                [
                    "DEL",
                    RedisKeys.DriverLicenseUploadConsecutiveFailures(userId, normalizedVehicleType),
                    RedisKeys.DriverLicenseUploadLock(userId, normalizedVehicleType)
                ],
                cancellationToken);
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(exception, "Upstash Redis is unavailable. Driver license upload accepted state was not stored.");
        }
    }

    private async Task<int> GetIntAsync(string key, CancellationToken cancellationToken)
    {
        var result = await SendCommandAsync(["GET", key], cancellationToken);
        if (result.ValueKind == JsonValueKind.String && int.TryParse(result.GetString(), out var value))
        {
            return value;
        }

        if (result.ValueKind == JsonValueKind.Number && result.TryGetInt32(out var number))
        {
            return number;
        }

        return 0;
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

    private static string DateKey()
    {
        return DateTime.UtcNow.ToString("yyyyMMdd");
    }

    private static string NormalizeVehicleType(string vehicleType)
    {
        return vehicleType.Equals("Car", StringComparison.OrdinalIgnoreCase) ? "Car" : "Motorbike";
    }

    private static int SecondsUntilTomorrowUtc()
    {
        return Math.Max(1, (int)Math.Ceiling((DateTime.UtcNow.Date.AddDays(1) - DateTime.UtcNow).TotalSeconds));
    }

    private static bool IsUpstashFailure(Exception exception, CancellationToken cancellationToken)
    {
        return exception is HttpRequestException
            or JsonException
            or InvalidOperationException
            || exception is TaskCanceledException && !cancellationToken.IsCancellationRequested;
    }
}
