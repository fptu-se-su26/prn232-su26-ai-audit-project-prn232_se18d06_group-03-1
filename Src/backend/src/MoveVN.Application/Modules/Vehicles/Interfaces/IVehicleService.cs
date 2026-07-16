using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IVehicleService
{
    Task<PagedResult<VehicleListItemResponse>> GetMyVehiclesAsync(long ownerId, string? type, string? keyword, string? sortBy, int page, int pageSize, int? brandId = null, int? modelId = null, string? status = null, string? fuelType = null, string? seatCount = null, string? transmission = null, string? bodyType = null, string? bikeType = null, string? engineCapacity = null, CancellationToken cancellationToken = default);
    Task<VehicleResponse> GetByIdAsync(long id, long ownerId, CancellationToken cancellationToken = default);
    Task<VehicleResponse> CreateAsync(long ownerId, CreateVehicleRequest request, CancellationToken cancellationToken = default);
    Task<string> UploadImageAsync(long ownerId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task<VehicleResponse> UploadDocumentAsync(long id, long ownerId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task<VehicleResponse> UpdateAsync(long id, long ownerId, UpdateVehicleRequest request, CancellationToken cancellationToken = default);
    Task ToggleStatusAsync(long id, long ownerId, CancellationToken cancellationToken = default);
    Task DeleteVehicleAsync(long id, long ownerId, CancellationToken cancellationToken = default);
}
