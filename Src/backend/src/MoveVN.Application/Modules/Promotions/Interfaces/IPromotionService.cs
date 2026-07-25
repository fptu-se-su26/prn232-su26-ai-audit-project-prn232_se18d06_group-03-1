using MoveVN.Application.Modules.Promotions.DTOs;

namespace MoveVN.Application.Modules.Promotions.Interfaces;

public interface IPromotionService
{
    Task<PromotionResponse> CreateAsync(CreatePromotionRequest request, long? ownerIdOverride, CancellationToken ct = default);
    Task<PromotionResponse> UpdateAsync(long id, UpdatePromotionRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(long id, CancellationToken ct = default);
    Task<bool> ToggleActiveAsync(long id, CancellationToken ct = default);
    Task<PromotionResponse?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<(List<PromotionResponse> Items, int TotalCount)> GetListAsync(string? keyword, bool? isActive, int page, int pageSize, CancellationToken ct = default);
    Task<ApplyPromotionResponse> ValidateAndCalculateAsync(ApplyPromotionRequest request, long customerId, CancellationToken ct = default);
    Task<List<PromotionUsageResponse>> GetUsagesAsync(long promotionId, CancellationToken ct = default);
    Task<List<PromotionResponse>> GetActiveForCustomerAsync(long? vehicleId, CancellationToken ct = default);
    Task<PromotionResponse> ApproveAsync(long id, long ownerId, CancellationToken ct = default);
    Task<PromotionResponse> RejectAsync(long id, long ownerId, CancellationToken ct = default);
    Task<List<PromotionResponse>> GetPendingForOwnerAsync(long ownerId, CancellationToken ct = default);
    Task<List<PromotionResponse>> GetMyPromotionsAsync(long ownerId, CancellationToken ct = default);
    Task<PromotionResponse> AdminUpdateApprovalAsync(long id, string status, CancellationToken ct = default);
}
