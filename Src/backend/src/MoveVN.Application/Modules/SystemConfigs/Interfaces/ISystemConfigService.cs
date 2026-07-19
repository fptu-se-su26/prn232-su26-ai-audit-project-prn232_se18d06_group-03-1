using MoveVN.Application.Modules.SystemConfigs.DTOs;

namespace MoveVN.Application.Modules.SystemConfigs.Interfaces;

public interface ISystemConfigService
{
    Task<IReadOnlyList<SystemConfigResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SystemConfigResponse>> UpdateAsync(UpdateSystemConfigRequest request, long? updatedBy, CancellationToken cancellationToken = default);
    Task<string> GetStringAsync(string key, string fallback, CancellationToken cancellationToken = default);
    Task<int> GetIntAsync(string key, int fallback, CancellationToken cancellationToken = default);
    Task<decimal> GetDecimalAsync(string key, decimal fallback, CancellationToken cancellationToken = default);
    Task<bool> GetBoolAsync(string key, bool fallback, CancellationToken cancellationToken = default);
}
