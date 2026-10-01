using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Banners.Interfaces;

public interface IBannerRepository
{
    Task<Banner?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<List<Banner>> GetListAsync(string? keyword, bool? isActive, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetListCountAsync(string? keyword, bool? isActive, CancellationToken ct = default);
    Task<List<Banner>> GetHomepageVisibleAsync(DateTime now, CancellationToken ct = default);
    Task AddAsync(Banner entity, CancellationToken ct = default);
    void Update(Banner entity);
    void Remove(Banner entity);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
