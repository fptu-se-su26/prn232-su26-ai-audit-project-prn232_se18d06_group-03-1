using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Banners.DTOs;

namespace MoveVN.Application.Modules.Banners.Interfaces;

public interface IBannerService
{
    Task<BannerResponse> CreateAsync(CreateBannerRequest request, long createdBy, CancellationToken ct = default);
    Task<BannerResponse> UpdateAsync(long id, UpdateBannerRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(long id, CancellationToken ct = default);
    Task<bool> ToggleActiveAsync(long id, CancellationToken ct = default);
    Task<BannerResponse?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<PagedResult<BannerResponse>> GetListAsync(string? keyword, bool? isActive, int page, int pageSize, CancellationToken ct = default);
    Task<List<HomepageBannerItem>> GetHomepageAsync(CancellationToken ct = default);
}
