using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Promotions.Interfaces;

public interface IPromotionRepository
{
    Task<Promotion?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<Promotion?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<List<Promotion>> GetListAsync(string? keyword, bool? isActive, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetListCountAsync(string? keyword, bool? isActive, CancellationToken ct = default);
    Task<List<Promotion>> GetActivePromotionsAsync(DateTime now, CancellationToken ct = default);
    Task AddAsync(Promotion entity, CancellationToken ct = default);
    void Update(Promotion entity);
    void Remove(Promotion entity);
    Task<int> SaveChangesAsync(CancellationToken ct = default);

    Task<List<PromotionUsage>> GetUsagesAsync(long promotionId, CancellationToken ct = default);
    Task AddUsageAsync(PromotionUsage usage, CancellationToken ct = default);
    Task<Vehicle?> GetVehicleByIdAsync(long id, CancellationToken ct = default);
    Task<List<Promotion>> GetPendingForOwnerAsync(long ownerId, CancellationToken ct = default);
    Task<List<Promotion>> GetMyPromotionsAsync(long ownerId, CancellationToken ct = default);
}
