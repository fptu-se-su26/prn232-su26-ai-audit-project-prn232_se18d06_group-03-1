using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Owner.DTOs;

namespace MoveVN.Application.Modules.Owner.Interfaces;

public interface INationalIdReviewService
{
    Task<PagedResult<NationalIdVerificationListItem>> GetListAsync(string? status, string? keyword, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<NationalIdVerificationDetailDto> GetDetailAsync(long id, CancellationToken cancellationToken = default);
    Task ApproveAsync(long id, CancellationToken cancellationToken = default);
    Task RejectAsync(long id, string reason, CancellationToken cancellationToken = default);
    Task RequestMoreInfoAsync(long id, string reason, CancellationToken cancellationToken = default);
}
