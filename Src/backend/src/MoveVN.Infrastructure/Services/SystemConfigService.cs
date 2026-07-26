using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.AuditLogs.Interfaces;
using MoveVN.Application.Modules.SystemConfigs.DTOs;
using MoveVN.Application.Modules.SystemConfigs.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Infrastructure.Services;

public class SystemConfigService : ISystemConfigService
{
    private const string CacheKey = "movevn:system-config:values";
    private const string HttpClientName = "UpstashRedis";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<SystemConfigService> _logger;

    public SystemConfigService(AppDbContext context, IHttpClientFactory httpClientFactory,
        IConfiguration configuration, IAuditLogService auditLogService, ILogger<SystemConfigService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<SystemConfigResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        await EnsureDefaultsAsync(cancellationToken);
        var configs = await _context.SystemConfig.AsNoTracking().ToListAsync(cancellationToken);
        return Map(configs);
    }

    public async Task<IReadOnlyList<SystemConfigResponse>> UpdateAsync(UpdateSystemConfigRequest request, long? updatedBy, CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
        {
            return await GetAllAsync(cancellationToken);
        }

        await EnsureDefaultsAsync(cancellationToken);
        var definitions = SystemConfigKeys.Definitions.ToDictionary(x => x.ConfigKey, StringComparer.OrdinalIgnoreCase);
        var keys = request.Items.Select(x => x.ConfigKey.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var configs = await _context.SystemConfig
            .Where(x => keys.Contains(x.ConfigKey))
            .ToListAsync(cancellationToken);
        var configByKey = SelectLatestByKey(configs);
        var changes = new List<(SystemConfig Config, string? OldValue, string NewValue)>();

        foreach (var item in request.Items)
        {
            var key = item.ConfigKey.Trim();
            if (!definitions.TryGetValue(key, out var definition))
            {
                throw new AppException(ErrorCode.VALIDATION_ERROR, [$"Unknown system config key: {key}"]);
            }

            var value = NormalizeValue(definition, item.ConfigValue);
            configByKey.TryGetValue(key, out var config);
            if (config is null)
            {
                config = new SystemConfig
                {
                    ConfigKey = definition.ConfigKey,
                    DataType = definition.DataType,
                    Description = definition.Description
                };
                await _context.SystemConfig.AddAsync(config, cancellationToken);
                configs.Add(config);
                configByKey[key] = config;
            }

            var oldValue = config.ConfigValue;
            config.ConfigValue = value;
            config.DataType = definition.DataType;
            config.Description = definition.Description;
            config.UpdatedBy = updatedBy;
            config.UpdatedAt = DateTime.UtcNow;
            if (!string.Equals(oldValue, value, StringComparison.Ordinal))
                changes.Add((config, oldValue, value));
        }

        await _context.SaveChangesAsync(cancellationToken);
        await RemoveSharedCacheAsync(cancellationToken);
        if (updatedBy.HasValue)
        {
            foreach (var change in changes)
            {
                await _auditLogService.LogAsync(updatedBy.Value, "Admin", "SystemConfig.Update",
                    "SystemConfig", change.Config.Id,
                    new { change.Config.ConfigKey, ConfigValue = change.OldValue },
                    new { change.Config.ConfigKey, ConfigValue = change.NewValue },
                    ct: cancellationToken);
            }
        }
        return await GetAllAsync(cancellationToken);
    }

    public async Task<string> GetStringAsync(string key, string fallback, CancellationToken cancellationToken = default)
    {
        var values = await GetCachedValuesAsync(cancellationToken);
        return values.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;
    }

    public async Task<int> GetIntAsync(string key, int fallback, CancellationToken cancellationToken = default)
    {
        var value = await GetStringAsync(key, fallback.ToString(), cancellationToken);
        return int.TryParse(value, out var parsed) ? parsed : fallback;
    }

    public async Task<decimal> GetDecimalAsync(string key, decimal fallback, CancellationToken cancellationToken = default)
    {
        var value = await GetStringAsync(key, fallback.ToString(System.Globalization.CultureInfo.InvariantCulture), cancellationToken);
        return decimal.TryParse(value, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var parsed) ? parsed : fallback;
    }

    public async Task<bool> GetBoolAsync(string key, bool fallback, CancellationToken cancellationToken = default)
    {
        var value = await GetStringAsync(key, fallback.ToString().ToLowerInvariant(), cancellationToken);
        return bool.TryParse(value, out var parsed) ? parsed : fallback;
    }

    private async Task<Dictionary<string, string>> GetCachedValuesAsync(CancellationToken cancellationToken)
    {
        var cached = await GetSharedCacheAsync(cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        await EnsureDefaultsAsync(cancellationToken);
        var configs = await _context.SystemConfig
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var values = SelectLatestByKey(configs)
            .ToDictionary(x => x.Key, x => x.Value.ConfigValue, StringComparer.OrdinalIgnoreCase);

        await SetSharedCacheAsync(values, cancellationToken);
        return values;
    }

    private async Task EnsureDefaultsAsync(CancellationToken cancellationToken)
    {
        var existingKeys = await _context.SystemConfig
            .Select(x => x.ConfigKey)
            .ToListAsync(cancellationToken);

        var missingDefinitions = SystemConfigKeys.Definitions
            .Where(definition => !existingKeys.Any(key => string.Equals(key, definition.ConfigKey, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        if (missingDefinitions.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        foreach (var definition in missingDefinitions)
        {
            await _context.SystemConfig.AddAsync(new SystemConfig
            {
                ConfigKey = definition.ConfigKey,
                ConfigValue = definition.DefaultValue,
                DataType = definition.DataType,
                Description = definition.Description,
                UpdatedAt = now
            }, cancellationToken);
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await RemoveSharedCacheAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            _context.ChangeTracker.Clear();
            await RemoveSharedCacheAsync(cancellationToken);
        }
    }

    private static IReadOnlyList<SystemConfigResponse> Map(IReadOnlyCollection<SystemConfig> configs)
    {
        var byKey = SelectLatestByKey(configs);
        return SystemConfigKeys.Definitions
            .OrderBy(x => x.Category)
            .ThenBy(x => x.ConfigKey)
            .Select(definition =>
            {
                byKey.TryGetValue(definition.ConfigKey, out var config);
                return new SystemConfigResponse
                {
                    Id = config?.Id ?? 0,
                    ConfigKey = definition.ConfigKey,
                    ConfigValue = config?.ConfigValue ?? definition.DefaultValue,
                    DataType = definition.DataType,
                    Category = definition.Category,
                    DisplayName = definition.DisplayName,
                    Description = definition.Description,
                    UpdatedBy = config?.UpdatedBy,
                    UpdatedAt = config?.UpdatedAt ?? DateTime.UtcNow
                };
            })
            .ToList();
    }

    private static Dictionary<string, SystemConfig> SelectLatestByKey(IEnumerable<SystemConfig> configs)
    {
        return configs
            .Where(config => !string.IsNullOrWhiteSpace(config.ConfigKey))
            .GroupBy(config => config.ConfigKey.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(config => config.UpdatedAt)
                    .ThenByDescending(config => config.Id)
                    .First(),
                StringComparer.OrdinalIgnoreCase);
    }

    private static string NormalizeValue(SystemConfigDefinition definition, string rawValue)
    {
        var value = rawValue.Trim();
        return definition.DataType switch
        {
            "bool" when bool.TryParse(value, out var parsed) => parsed.ToString().ToLowerInvariant(),
            "int" when int.TryParse(value, out var parsed) && parsed >= 0 => parsed.ToString(),
            "decimal" when decimal.TryParse(value, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var parsed)
                && (!definition.MinValue.HasValue || parsed >= definition.MinValue)
                && (!definition.MaxValue.HasValue || parsed <= definition.MaxValue)
                => parsed.ToString(System.Globalization.CultureInfo.InvariantCulture),
            "string" => value,
            _ => throw new AppException(ErrorCode.VALIDATION_ERROR, [$"Invalid value for {definition.ConfigKey}. Expected {definition.DataType}."])
        };
    }

    private bool IsRedisConfigured() =>
        !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_URL"])
        && !string.IsNullOrWhiteSpace(_configuration["UPSTASH_REDIS_REST_TOKEN"]);

    private async Task<Dictionary<string, string>?> GetSharedCacheAsync(CancellationToken ct)
    {
        if (!IsRedisConfigured()) return null;
        try
        {
            var result = await SendRedisCommandAsync(["GET", CacheKey], ct);
            return result.ValueKind == JsonValueKind.String
                ? JsonSerializer.Deserialize<Dictionary<string, string>>(result.GetString()!)
                : null;
        }
        catch (Exception ex) when (IsRedisFailure(ex, ct))
        {
            _logger.LogWarning(ex, "Shared system config cache is unavailable. Falling back to database.");
            return null;
        }
    }

    private async Task SetSharedCacheAsync(Dictionary<string, string> values, CancellationToken ct)
    {
        if (!IsRedisConfigured()) return;
        try
        {
            await SendRedisCommandAsync(["SET", CacheKey, JsonSerializer.Serialize(values), "EX",
                (long)CacheDuration.TotalSeconds], ct);
        }
        catch (Exception ex) when (IsRedisFailure(ex, ct))
        {
            _logger.LogWarning(ex, "Shared system config cache could not be updated.");
        }
    }

    private async Task RemoveSharedCacheAsync(CancellationToken ct)
    {
        if (!IsRedisConfigured()) return;
        try { await SendRedisCommandAsync(["DEL", CacheKey], ct); }
        catch (Exception ex) when (IsRedisFailure(ex, ct))
        {
            _logger.LogWarning(ex, "Shared system config cache could not be invalidated.");
        }
    }

    private async Task<JsonElement> SendRedisCommandAsync(object[] command, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post,
            _configuration["UPSTASH_REDIS_REST_URL"]!.TrimEnd('/'))
        {
            Content = JsonContent.Create(command)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Bearer", _configuration["UPSTASH_REDIS_REST_TOKEN"]);
        using var response = await _httpClientFactory.CreateClient(HttpClientName).SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        using var payload = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        if (!payload.RootElement.TryGetProperty("result", out var result))
            throw new JsonException("Upstash Redis response does not contain a result.");
        return result.Clone();
    }

    private static bool IsRedisFailure(Exception ex, CancellationToken ct) =>
        ex is HttpRequestException or JsonException or InvalidOperationException
        || ex is TaskCanceledException && !ct.IsCancellationRequested;
}
