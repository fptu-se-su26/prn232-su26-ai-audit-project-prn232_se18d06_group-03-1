using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.VoucherClaims.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class VoucherClaimRepository : IVoucherClaimRepository
{
    private readonly AppDbContext _ctx;

    public VoucherClaimRepository(AppDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<List<Promotion>> GetAvailablePromotionsAsync(long customerId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var claimedIds = await _ctx.VoucherClaims
            .Where(vc => vc.CustomerId == customerId)
            .Select(vc => vc.PromotionId)
            .ToListAsync(ct);

        return await _ctx.Promotions
            .Where(p => p.IsActive
                && p.ApprovalStatus == "Approved"
                && (!p.EndAt.HasValue || p.EndAt >= now)
                && p.UsageCount < p.MaxUsageCount
                && !claimedIds.Contains(p.Id))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<List<VoucherClaim>> GetClaimsByCustomerAsync(long customerId, CancellationToken ct = default)
        => await _ctx.VoucherClaims
            .Where(vc => vc.CustomerId == customerId)
            .OrderByDescending(vc => vc.ClaimedAt)
            .ToListAsync(ct);

    public async Task<VoucherClaim?> GetClaimAsync(long customerId, long promotionId, CancellationToken ct = default)
        => await _ctx.VoucherClaims
            .FirstOrDefaultAsync(vc => vc.CustomerId == customerId && vc.PromotionId == promotionId, ct);

    public async Task AddClaimAsync(VoucherClaim claim, CancellationToken ct = default)
        => await _ctx.VoucherClaims.AddAsync(claim, ct);

    public async Task<Promotion?> GetPromotionByIdAsync(long id, CancellationToken ct = default)
        => await _ctx.Promotions.FindAsync(new object[] { id }, ct);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _ctx.SaveChangesAsync(ct);
}
