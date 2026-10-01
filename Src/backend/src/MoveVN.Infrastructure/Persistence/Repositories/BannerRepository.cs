using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Banners.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class BannerRepository : IBannerRepository
{
    private readonly AppDbContext _ctx;

    public BannerRepository(AppDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<Banner?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _ctx.Banners.FindAsync(new object[] { id }, ct);

    public async Task<List<Banner>> GetListAsync(string? keyword, bool? isActive, int page, int pageSize, CancellationToken ct = default)
    {
        var query = ApplyFilters(_ctx.Banners.AsQueryable(), keyword, isActive);

        return await query
            .OrderBy(b => b.DisplayOrder)
            .ThenByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<int> GetListCountAsync(string? keyword, bool? isActive, CancellationToken ct = default)
        => await ApplyFilters(_ctx.Banners.AsQueryable(), keyword, isActive).CountAsync(ct);

    public async Task<List<Banner>> GetHomepageVisibleAsync(DateTime now, CancellationToken ct = default)
        => await _ctx.Banners
            .Where(b => b.IsActive
                && (!b.StartAt.HasValue || b.StartAt <= now)
                && (!b.EndAt.HasValue || b.EndAt >= now))
            .OrderBy(b => b.DisplayOrder)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Banner entity, CancellationToken ct = default)
        => await _ctx.Banners.AddAsync(entity, ct);

    public void Update(Banner entity) => _ctx.Banners.Update(entity);

    public void Remove(Banner entity) => _ctx.Banners.Remove(entity);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _ctx.SaveChangesAsync(ct);

    private static IQueryable<Banner> ApplyFilters(IQueryable<Banner> query, string? keyword, bool? isActive)
    {
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(b => b.Title.ToLower().Contains(kw) || b.PopupTitle.ToLower().Contains(kw));
        }

        if (isActive.HasValue)
            query = query.Where(b => b.IsActive == isActive.Value);

        return query;
    }
}
