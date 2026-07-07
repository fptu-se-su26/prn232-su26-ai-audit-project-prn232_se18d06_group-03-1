using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IBlockedDateService
{
    Task<BlockedDateResponse> CreateAsync(long vehicleId, long ownerId, BlockedDateRequest request, CancellationToken cancellationToken = default);
    Task<List<BlockedDateResponse>> GetByVehicleAsync(long vehicleId, long ownerId, CancellationToken cancellationToken = default);
    Task DeleteAsync(long blockedDateId, long ownerId, CancellationToken cancellationToken = default);
}
