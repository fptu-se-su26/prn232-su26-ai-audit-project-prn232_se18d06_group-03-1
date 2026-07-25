using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Interfaces;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using MoveVN.Infrastructure.Caching;

namespace MoveVN.Infrastructure.Services;

public class OtpService : IOtpService
{
    private const int MaxOtpAttempts = 5;
    private const int MaxResendPerDay = 5;
    private const string HttpClientName = "UpstashRedis";

    private readonly IOtpCodeRepository _otpCodeRepository;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly IEmailSender _emailSender;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public OtpService(
        IOtpCodeRepository otpCodeRepository,
        IPasswordHasherService passwordHasherService,
        IEmailSender emailSender,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _otpCodeRepository = otpCodeRepository;
        _passwordHasherService = passwordHasherService;
        _emailSender = emailSender;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task CreateOtpAsync(string email, OtpPurpose purpose, long? userId, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (IsRedisConfigured())
        {
            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var redisKey = RedisKeys.OtpResendDaily(email, today);

            var count = await RedisIncrementAsync(redisKey, cancellationToken);
            if (count == 1)
            {
                var ttl = DateTime.UtcNow.Date.AddDays(1) - DateTime.UtcNow;
                await RedisSetExpiryAsync(redisKey, (int)ttl.TotalSeconds, cancellationToken);
            }

            if (count > MaxResendPerDay)
            {
                throw new AppException(ErrorCode.OTP_RATE_LIMITED);
            }
        }

        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

        await _otpCodeRepository.AddAsync(new OtpCode
        {
            UserId = userId,
            Email = email.Trim().ToLowerInvariant(),
            OtpCodeHash = _passwordHasherService.Hash(otp),
            Purpose = purpose.ToString(),
            IpAddress = ipAddress,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _emailSender.SendOtpAsync(email, otp, purpose.ToString(), cancellationToken);
    }

    public async Task VerifyOtpAsync(string email, string otp, OtpPurpose purpose, CancellationToken cancellationToken = default)
    {
        var otpCode = await _otpCodeRepository.GetLatestAsync(email, purpose, cancellationToken)
            ?? throw new AppException(ErrorCode.OTP_FAIL);

        if (otpCode.IsUsed)
        {
            throw new AppException(ErrorCode.OTP_ALREADY_USED);
        }

        if (otpCode.Attempts >= MaxOtpAttempts)
        {
            throw new AppException(ErrorCode.OTP_LOCKED);
        }

        if (otpCode.ExpiresAt <= DateTime.UtcNow || !_passwordHasherService.Verify(otpCode.OtpCodeHash, otp))
        {
            otpCode.Attempts++;
            _otpCodeRepository.Update(otpCode);
            throw new AppException(ErrorCode.OTP_FAIL);
        }

        otpCode.IsUsed = true;
        otpCode.UsedAt = DateTime.UtcNow;
        _otpCodeRepository.Update(otpCode);
    }

    public async Task<int> GetResendCountAsync(string email, CancellationToken cancellationToken = default)
    {
        if (!IsRedisConfigured())
        {
            return 0;
        }

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var redisKey = RedisKeys.OtpResendDaily(email, today);
        return await RedisGetAsync(redisKey, cancellationToken);
    }

    private bool IsRedisConfigured()
    {
        return !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_URL"])
            && !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_TOKEN"]);
    }

    private async Task<int> RedisIncrementAsync(string key, CancellationToken cancellationToken)
    {
        var result = await SendRedisCommandAsync(["INCR", key], cancellationToken);
        return result.ValueKind == JsonValueKind.Number ? result.GetInt32() : 0;
    }

    private async Task RedisSetExpiryAsync(string key, int ttlSeconds, CancellationToken cancellationToken)
    {
        await SendRedisCommandAsync(["EXPIRE", key, ttlSeconds.ToString()], cancellationToken);
    }

    private async Task<int> RedisGetAsync(string key, CancellationToken cancellationToken)
    {
        var result = await SendRedisCommandAsync(["GET", key], cancellationToken);
        if (result.ValueKind == JsonValueKind.Number)
        {
            return result.GetInt32();
        }
        if (result.ValueKind == JsonValueKind.String && int.TryParse(result.GetString(), out var val))
        {
            return val;
        }
        return 0;
    }

    private async Task<JsonElement> SendRedisCommandAsync(object[] command, CancellationToken cancellationToken)
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
}
