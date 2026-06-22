using MoveVN.Application.Modules.Owner.DTOs;

namespace MoveVN.Application.Modules.Owner.Interfaces;

public interface IStaffOwnerApplicationService
{
    Task<List<StaffOwnerApplicationListItem>> GetApplicationsAsync(string? status, string? keyword, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
    Task<StaffOwnerApplicationDetailResponse> GetApplicationDetailAsync(long id, CancellationToken cancellationToken = default);
    Task ApproveApplicationAsync(long id, CancellationToken cancellationToken = default);
    Task RejectApplicationAsync(long id, string reason, CancellationToken cancellationToken = default);
    Task RequestMoreInfoAsync(long id, string reason, CancellationToken cancellationToken = default);
}
