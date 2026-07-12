using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Disputes.DTOs;

namespace MoveVN.Application.Modules.Disputes.Interfaces;

public interface IDisputeService
{
    Task<DisputeDetailResponse> CreateAsync(CreateDisputeRequest request, long userId, string actorRole, CancellationToken cancellationToken = default);
    Task<PagedResult<DisputeListItem>> GetMineAsync(long userId, DisputeListRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<DisputeListItem>> GetStaffQueueAsync(DisputeListRequest request, CancellationToken cancellationToken = default);
    Task<DisputeDetailResponse> GetByIdAsync(long id, long userId, bool isStaffOrAdmin, CancellationToken cancellationToken = default);
    Task<DisputeDetailResponse> MarkInvestigatingAsync(long id, long staffId, string actorRole, CancellationToken cancellationToken = default);
    Task<DisputeDetailResponse> ResolveAsync(long id, long actorId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default);
    Task<DisputeDetailResponse> EscalateAsync(long id, long staffId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default);
    Task<DisputeDetailResponse> AdminOverrideAsync(long id, long adminId, string actorRole, ResolveDisputeRequest request, CancellationToken cancellationToken = default);
}
