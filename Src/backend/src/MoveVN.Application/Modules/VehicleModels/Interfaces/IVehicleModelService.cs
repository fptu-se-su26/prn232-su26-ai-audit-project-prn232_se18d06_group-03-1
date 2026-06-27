using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleModels.DTOs;

namespace MoveVN.Application.Modules.VehicleModels.Interfaces;

public interface IVehicleModelService
{
    Task<PagedResult<VehicleModelResponse>> GetAllAsync(string? keyword, string? sortBy, string? vehicleType, int? brandId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<VehicleModelResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModelResponse> CreateAsync(CreateVehicleModelRequest request, CancellationToken cancellationToken = default);
    Task<VehicleModelResponse> UpdateAsync(int id, UpdateVehicleModelRequest request, CancellationToken cancellationToken = default);
    Task<ModelCascadeInfoResponse> GetCascadeInfoAsync(int id, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<List<VehicleModelResponse>> GetByBrandIdAsync(int brandId, CancellationToken cancellationToken = default);
}
