using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.PricingRules.DTOs;

namespace MoveVN.Application.Modules.PricingRules.Interfaces;

public interface IPricingRuleService
{
    Task<PagedResult<PricingRuleResponse>> GetAllAsync(string? keyword, long? vehicleId, string? ruleType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PricingRuleResponse> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<PricingRuleResponse> CreateAsync(CreatePricingRuleRequest request, CancellationToken cancellationToken = default);
    Task<PricingRuleResponse> UpdateAsync(long id, UpdatePricingRuleRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(long id, CancellationToken cancellationToken = default);
}
