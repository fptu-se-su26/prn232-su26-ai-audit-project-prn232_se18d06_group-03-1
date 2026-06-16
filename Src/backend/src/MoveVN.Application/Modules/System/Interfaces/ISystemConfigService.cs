using MoveVN.Application.Modules.System.DTOs;

namespace MoveVN.Application.Modules.System.Interfaces;

public interface ISystemConfigService
{
    Task<List<SystemConfigDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<SystemConfigDto?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<T> GetValueAsync<T>(string key, T defaultValue, CancellationToken cancellationToken = default);
    Task UpdateAsync(string key, UpdateSystemConfigRequest request, long adminId, CancellationToken cancellationToken = default);
}

public interface IAuditLogService
{
    Task LogAsync(long? actorId, string? actorRole, string action, string entityType,
        long? entityId = null, object? oldValue = null, object? newValue = null,
        string? ipAddress = null, string? userAgent = null,
        CancellationToken cancellationToken = default);
}
