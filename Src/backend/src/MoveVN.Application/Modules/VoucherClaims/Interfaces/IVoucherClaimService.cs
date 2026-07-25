using MoveVN.Application.Modules.VoucherClaims.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.VoucherClaims.Interfaces;

public interface IVoucherClaimRepository
{
    Task<List<Promotion>> GetAvailablePromotionsAsync(long customerId, CancellationToken ct = default);
    Task<List<VoucherClaim>> GetClaimsByCustomerAsync(long customerId, CancellationToken ct = default);
    Task<VoucherClaim?> GetClaimAsync(long customerId, long promotionId, CancellationToken ct = default);
    Task AddClaimAsync(VoucherClaim claim, CancellationToken ct = default);
    Task<Promotion?> GetPromotionByIdAsync(long id, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public interface IVoucherClaimService
{
    Task<List<VoucherHuntItem>> GetAvailableVouchersAsync(long customerId, CancellationToken ct = default);
    Task<List<VoucherClaimResponse>> GetMyWalletAsync(long customerId, CancellationToken ct = default);
    Task<VoucherClaimResponse> ClaimVoucherAsync(long customerId, long promotionId, CancellationToken ct = default);
}
