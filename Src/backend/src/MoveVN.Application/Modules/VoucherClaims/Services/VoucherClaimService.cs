using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.VoucherClaims.DTOs;
using MoveVN.Application.Modules.VoucherClaims.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.VoucherClaims.Services;

public class VoucherClaimService : IVoucherClaimService
{
    private readonly IVoucherClaimRepository _repo;

    public VoucherClaimService(IVoucherClaimRepository repo) => _repo = repo;

    public async Task<List<VoucherHuntItem>> GetAvailableVouchersAsync(long customerId, CancellationToken ct = default)
    {
        var promos = await _repo.GetAvailablePromotionsAsync(customerId, ct);
        return promos.Select(p => new VoucherHuntItem
        {
            PromotionId = p.Id,
            Code = p.Code,
            Name = p.Name,
            Description = p.Description,
            DiscountType = p.DiscountType,
            DiscountValue = p.DiscountValue,
            MaxDiscountAmount = p.MaxDiscountAmount,
            MinOrderAmount = p.MinOrderAmount,
            VehicleType = p.VehicleType,
            EndAt = p.EndAt,
            MaxUsageCount = p.MaxUsageCount,
            UsageCount = p.UsageCount,
            IsClaimed = false
        }).ToList();
    }

    public async Task<List<VoucherClaimResponse>> GetMyWalletAsync(long customerId, CancellationToken ct = default)
    {
        var claims = await _repo.GetClaimsByCustomerAsync(customerId, ct);
        var result = new List<VoucherClaimResponse>();

        foreach (var claim in claims)
        {
            var promo = await _repo.GetPromotionByIdAsync(claim.PromotionId, ct);
            if (promo == null) continue;

            result.Add(new VoucherClaimResponse
            {
                Id = claim.Id,
                PromotionId = claim.PromotionId,
                Code = promo.Code,
                Name = promo.Name,
                Description = promo.Description,
                DiscountType = promo.DiscountType,
                DiscountValue = promo.DiscountValue,
                MaxDiscountAmount = promo.MaxDiscountAmount,
                MinOrderAmount = promo.MinOrderAmount,
                VehicleType = promo.VehicleType,
                EndAt = promo.EndAt,
                MaxUsageCount = promo.MaxUsageCount,
                UsageCount = promo.UsageCount,
                ClaimedAt = claim.ClaimedAt,
                UsedAt = claim.UsedAt,
                BookingId = claim.BookingId
            });
        }

        return result;
    }

    public async Task<VoucherClaimResponse> ClaimVoucherAsync(long customerId, long promotionId, CancellationToken ct = default)
    {
        var existing = await _repo.GetClaimAsync(customerId, promotionId, ct);
        if (existing != null)
            throw new ValidationException(new[] { "Bạn đã nhận voucher này rồi." });

        var promo = await _repo.GetPromotionByIdAsync(promotionId, ct);
        if (promo == null)
            throw new NotFoundException("Voucher không tồn tại.");

        if (!promo.IsActive)
            throw new ValidationException(new[] { "Voucher không còn hoạt động." });

        if (promo.ApprovalStatus != "Approved")
            throw new ValidationException(new[] { "Voucher chưa được duyệt." });

        var now = DateTime.UtcNow;
        if (promo.StartAt > now)
            throw new ValidationException(new[] { "Voucher chưa bắt đầu." });

        if (promo.EndAt.HasValue && promo.EndAt < now)
            throw new ValidationException(new[] { "Voucher đã hết hạn." });

        if (promo.UsageCount >= promo.MaxUsageCount)
            throw new ValidationException(new[] { "Voucher đã hết lượt." });

        var claim = new VoucherClaim
        {
            CustomerId = customerId,
            PromotionId = promotionId,
            ClaimedAt = DateTime.UtcNow
        };

        await _repo.AddClaimAsync(claim, ct);
        await _repo.SaveChangesAsync(ct);

        return new VoucherClaimResponse
        {
            Id = claim.Id,
            PromotionId = promo.Id,
            Code = promo.Code,
            Name = promo.Name,
            Description = promo.Description,
            DiscountType = promo.DiscountType,
            DiscountValue = promo.DiscountValue,
            MaxDiscountAmount = promo.MaxDiscountAmount,
            MinOrderAmount = promo.MinOrderAmount,
            VehicleType = promo.VehicleType,
            EndAt = promo.EndAt,
            MaxUsageCount = promo.MaxUsageCount,
            UsageCount = promo.UsageCount,
            ClaimedAt = claim.ClaimedAt,
            UsedAt = null,
            BookingId = null
        };
    }
}
