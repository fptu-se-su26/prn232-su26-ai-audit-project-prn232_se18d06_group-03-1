using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Areas.DTOs;

namespace MoveVN.Application.Modules.Areas.Interfaces;

public interface IAreaService
{
    Task<PagedResult<AreaResponse>> GetAllAsync(string? keyword, string? province, int? pricingRegionId, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<List<string>> GetProvincesAsync(CancellationToken cancellationToken = default);
    Task<AreaResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AreaResponse> CreateAsync(CreateAreaRequest request, CancellationToken cancellationToken = default);
    Task<AreaResponse> UpdateAsync(int id, UpdateAreaRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
