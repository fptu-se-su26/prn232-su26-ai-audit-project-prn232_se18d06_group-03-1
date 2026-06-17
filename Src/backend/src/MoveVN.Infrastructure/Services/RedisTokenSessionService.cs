using System.Text.Json;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Infrastructure.Caching;

namespace MoveVN.Infrastructure.Services;

public class RedisTokenSessionService : ITokenSessionService
{
    private const string HttpClientName = "UpstashRedis";
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RedisTokenSessionService> _logger;

    public RedisTokenSessionService(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<RedisTokenSessionService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task StoreAsync(AuthUserResponse user, TokenResponse token, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured() || string.IsNullOrWhiteSpace(token.AccessTokenJti))
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
            var ttlSeconds = Math.Max(1, (long)Math.Ceiling(ttl.TotalSeconds));
            await SendCommandAsync(
                [
                    "SET",
                    RedisKeys.Session(token.AccessTokenJti),
                    JsonSerializer.Serialize(session),
                    "EX",
                    ttlSeconds
                ],
                cancellationToken);
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(
                exception,
                "Upstash Redis is unavailable. Access token session was not cached.");
        }
    }

    public async Task<bool> IsActiveAsync(string jti, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return true;
        }

        try
        {
            var result = await SendCommandAsync(
                ["EXISTS", RedisKeys.Session(jti)],
                cancellationToken);

            return result.ValueKind == JsonValueKind.Number && result.GetInt32() > 0;
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(
                exception,
                "Upstash Redis is unavailable. Falling back to normal JWT validation.");
            return true;
        }
    }

    public async Task RevokeAsync(string jti, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            return;
        }

        try
        {
            await SendCommandAsync(
                ["DEL", RedisKeys.Session(jti)],
                cancellationToken);
        }
        catch (Exception exception) when (IsUpstashFailure(exception, cancellationToken))
        {
            _logger.LogWarning(
                exception,
                "Upstash Redis is unavailable. Token session revoke was skipped.");
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
