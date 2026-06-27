using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.PlatformFeeRules.DTOs;

namespace MoveVN.Application.Modules.PlatformFeeRules.Interfaces;

public interface IPlatformFeeRuleService
{
    Task<PagedResult<PlatformFeeRuleResponse>> GetAllAsync(string? keyword, string? targetType, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PlatformFeeRuleResponse> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<PlatformFeeRuleResponse> CreateAsync(CreatePlatformFeeRuleRequest request, CancellationToken cancellationToken = default);
    Task<PlatformFeeRuleResponse> UpdateAsync(long id, UpdatePlatformFeeRuleRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(long id, CancellationToken cancellationToken = default);
}
