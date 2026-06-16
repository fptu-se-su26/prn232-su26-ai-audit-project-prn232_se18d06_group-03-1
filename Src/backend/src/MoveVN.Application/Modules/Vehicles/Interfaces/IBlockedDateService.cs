using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IBlockedDateService
{
    Task<BlockedDateDto> CreateAsync(long vehicleId, long ownerId, CreateBlockedDateRequest request, CancellationToken cancellationToken = default);
    Task<List<BlockedDateDto>> GetByVehicleAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task DeleteAsync(long id, long ownerId, CancellationToken cancellationToken = default);
}
