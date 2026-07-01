using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleFeatures.DTOs;

namespace MoveVN.Application.Modules.VehicleFeatures.Interfaces;

public interface IVehicleFeatureService
{
    Task<PagedResult<VehicleFeatureResponse>> GetAllAsync(string? keyword, string? sortBy, string? vehicleType, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<VehicleFeatureResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleFeatureResponse> CreateAsync(CreateVehicleFeatureRequest request, CancellationToken cancellationToken = default);
    Task<VehicleFeatureResponse> UpdateAsync(int id, UpdateVehicleFeatureRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
