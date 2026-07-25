using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Promotions.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class PromotionRepository : IPromotionRepository
{
    private readonly AppDbContext _ctx;

    public PromotionRepository(AppDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<Promotion?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _ctx.Promotions.FindAsync(new object[] { id }, ct);

    public async Task<Promotion?> GetByCodeAsync(string code, CancellationToken ct = default)
        => await _ctx.Promotions.FirstOrDefaultAsync(p => p.Code == code, ct);

    public async Task<List<Promotion>> GetListAsync(string? keyword, bool? isActive, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _ctx.Promotions.AsQueryable();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(p => p.Code.ToLower().Contains(kw) || p.Name.ToLower().Contains(kw));
        }
        if (isActive.HasValue)
            query = query.Where(p => p.IsActive == isActive.Value);

        return await query.OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
    }

    public async Task<int> GetListCountAsync(string? keyword, bool? isActive, CancellationToken ct = default)
    {
        var query = _ctx.Promotions.AsQueryable();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(p => p.Code.ToLower().Contains(kw) || p.Name.ToLower().Contains(kw));
        }
        if (isActive.HasValue)
            query = query.Where(p => p.IsActive == isActive.Value);
        return await query.CountAsync(ct);
    }

    public async Task<List<Promotion>> GetActivePromotionsAsync(DateTime now, CancellationToken ct = default)
        => await _ctx.Promotions
            .Where(p => p.IsActive && p.ApprovalStatus == "Approved" && p.StartAt <= now && (!p.EndAt.HasValue || p.EndAt >= now) && p.UsageCount < p.MaxUsageCount)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Promotion entity, CancellationToken ct = default)
        => await _ctx.Promotions.AddAsync(entity, ct);

    public void Update(Promotion entity) => _ctx.Promotions.Update(entity);

    public void Remove(Promotion entity) => _ctx.Promotions.Remove(entity);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _ctx.SaveChangesAsync(ct);

    public async Task<List<PromotionUsage>> GetUsagesAsync(long promotionId, CancellationToken ct = default)
        => await _ctx.PromotionUsages
            .Where(u => u.PromotionId == promotionId)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(ct);

    public async Task AddUsageAsync(PromotionUsage usage, CancellationToken ct = default)
        => await _ctx.PromotionUsages.AddAsync(usage, ct);

    public async Task<Vehicle?> GetVehicleByIdAsync(long id, CancellationToken ct = default)
        => await _ctx.Vehicles.FindAsync(new object[] { id }, ct);

    public async Task<List<Promotion>> GetPendingForOwnerAsync(long ownerId, CancellationToken ct = default)
        => await _ctx.Promotions
            .Where(p => p.ApprovalStatus == "Pending" && p.CreatedByRole == "Admin" && (p.OwnerId == ownerId || p.OwnerId == null))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task<List<Promotion>> GetMyPromotionsAsync(long ownerId, CancellationToken ct = default)
        => await _ctx.Promotions
            .Where(p => p.CreatedByRole == "Owner" && p.OwnerId == ownerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
}
