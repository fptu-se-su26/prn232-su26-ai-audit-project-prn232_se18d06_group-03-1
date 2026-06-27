using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.PricingRegions.DTOs;

namespace MoveVN.Application.Modules.PricingRegions.Interfaces;

public interface IPricingRegionService
{
    Task<PagedResult<PricingRegionResponse>> GetAllAsync(string? keyword, string? sortBy, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PricingRegionResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PricingRegionResponse> CreateAsync(CreatePricingRegionRequest request, CancellationToken cancellationToken = default);
    Task<PricingRegionResponse> UpdateAsync(int id, UpdatePricingRegionRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
