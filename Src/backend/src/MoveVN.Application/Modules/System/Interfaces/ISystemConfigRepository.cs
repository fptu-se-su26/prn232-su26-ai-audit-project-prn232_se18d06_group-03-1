using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.System.Interfaces;

public interface ISystemConfigRepository
{
    Task<List<SystemConfig>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<SystemConfig?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);
    void Update(SystemConfig config);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
