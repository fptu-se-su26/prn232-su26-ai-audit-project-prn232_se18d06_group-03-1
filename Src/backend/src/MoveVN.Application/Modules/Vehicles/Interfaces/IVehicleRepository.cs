using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IVehicleRepository
{
    Task<Vehicle?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddVehicleAsync(Vehicle vehicle, CancellationToken cancellationToken = default);
    void UpdateVehicle(Vehicle vehicle);
    Task AddCarDetailAsync(CarDetail detail, CancellationToken cancellationToken = default);
    Task AddImageAsync(VehicleImage image, CancellationToken cancellationToken = default);
    Task<int> CountImagesAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<List<VehicleImageDto>> GetImagesAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<(decimal? avg, int count)> GetRatingAsync(long vehicleId, CancellationToken cancellationToken = default);
    Task<PagedResult<VehicleResponse>> GetPublicPagedAsync(VehicleListRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<VehicleResponse>> GetByStatusPagedAsync(string status, int page, int pageSize, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
