using MoveVN.Domain.Documents;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Notifications.DTOs;

namespace MoveVN.Application.Interfaces;

public interface IBroadcastNotificationLogService
{
    Task LogBroadcastAsync(BroadcastNotificationLogDocument log, CancellationToken cancellationToken = default);
    Task<PagedResult<BroadcastNotificationLogResponse>> GetLogsAsync(
        string? keyword, string? channel, string? status, DateTime? fromDate, DateTime? toDate,
        int page, int pageSize, CancellationToken cancellationToken = default);
}
