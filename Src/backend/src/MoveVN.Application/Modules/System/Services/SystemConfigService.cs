using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;
using System.Globalization;

namespace MoveVN.Application.Modules.System.Services;

public class SystemConfigService : ISystemConfigService
{
    private readonly ISystemConfigRepository _repo;
    private readonly IMemoryCache _cache;
    private const string CacheKeyPrefix = "config:";

    public SystemConfigService(ISystemConfigRepository repo, IMemoryCache cache)
    {
        _repo = repo;
        _cache = cache;
    }

    public async Task<List<SystemConfigDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var configs = await _repo.GetAllAsync(cancellationToken);
        return configs.Select(MapToDto).ToList();
    }

    public async Task<SystemConfigDto?> GetByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        var config = await GetOrLoadAsync(key, cancellationToken);
        return config is null ? null : MapToDto(config);
    }

    public async Task<T> GetValueAsync<T>(string key, T defaultValue, CancellationToken cancellationToken = default)
    {
        var config = await GetOrLoadAsync(key, cancellationToken);
        if (config is null) return defaultValue;

        try
        {
            return (T)Convert.ChangeType(config.ConfigValue, typeof(T), CultureInfo.InvariantCulture);
        }
        catch
        {
            return defaultValue;
        }
    }

    public async Task UpdateAsync(string key, UpdateSystemConfigRequest request, long adminId, CancellationToken cancellationToken = default)
    {
        var config = await _repo.GetByKeyAsync(key, cancellationToken)
            ?? throw new NotFoundException($"Config key '{key}' không tồn tại.");

        config.ConfigValue = request.ConfigValue;
        config.UpdatedBy = adminId;
        config.UpdatedAt = DateTime.UtcNow;

        _repo.Update(config);
        await _repo.SaveChangesAsync(cancellationToken);

        // Invalidate cache (hot-reload)
        _cache.Remove(CacheKeyPrefix + key);
    }

    private async Task<SystemConfig?> GetOrLoadAsync(string key, CancellationToken cancellationToken)
    {
        var cacheKey = CacheKeyPrefix + key;
        if (_cache.TryGetValue(cacheKey, out SystemConfig? cached))
            return cached;

        var config = await _repo.GetByKeyAsync(key, cancellationToken);
        if (config is not null)
            _cache.Set(cacheKey, config, TimeSpan.FromMinutes(5));

        return config;
    }

    private static SystemConfigDto MapToDto(SystemConfig c) => new()
    {
        Id = c.Id,
        ConfigKey = c.ConfigKey,
        ConfigValue = c.ConfigValue,
        DataType = c.DataType,
        Description = c.Description,
        UpdatedAt = c.UpdatedAt
    };
}
