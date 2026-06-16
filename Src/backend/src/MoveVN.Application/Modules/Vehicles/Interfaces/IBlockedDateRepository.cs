using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IBlockedDateRepository
{
    Task<BlockedDate?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(BlockedDate blocked, CancellationToken cancellationToken = default);
    void Remove(BlockedDate blocked);
    Task<Vehicle?> GetVehicleAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<bool> HasBookingOverlapAsync(long vehicleId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
    Task<List<BlockedDateDto>> GetByVehicleAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
