using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Admin.Interfaces;

public interface IAdminPostManagementService
{
    Task<AdminPostStatsResponse> GetPostStatsAsync(CancellationToken cancellationToken = default);
    Task<AdminVehicleOcrPreviewResponse> PreviewVehicleOcrAsync(AdminVehicleOcrPreviewRequest request, CancellationToken cancellationToken = default);
    Task<VehicleResponse> CreateVehicleAsync(CreateAdminVehicleRequest request, long adminUserId, CancellationToken cancellationToken = default);
    Task<PagedResult<AdminOwnerListItem>> GetOwnersWithVehiclesAsync(string? keyword, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PagedResult<AdminOwnerVehicleListItem>> GetOwnerVehiclesAsync(long ownerId, string? vehicleType, int page, int pageSize, CancellationToken cancellationToken = default);
}
