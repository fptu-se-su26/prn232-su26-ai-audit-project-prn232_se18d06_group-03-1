using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IVehicleModerationService
{
    Task<PagedResult<VehicleModerationListItem>> GetVehiclesAsync(
        string? status,
        string? documentStatus,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<VehicleModerationDetailResponse> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task ApproveDocumentAsync(long vehicleId, long documentId, CancellationToken cancellationToken = default);
    Task RejectDocumentAsync(long vehicleId, long documentId, string reason, CancellationToken cancellationToken = default);
    Task RequestMoreInfoAsync(long vehicleId, long documentId, string reason, CancellationToken cancellationToken = default);
    Task ApproveListingAsync(long vehicleId, bool allowOverride, CancellationToken cancellationToken = default);
    Task RejectListingAsync(long vehicleId, string reason, CancellationToken cancellationToken = default);
}
