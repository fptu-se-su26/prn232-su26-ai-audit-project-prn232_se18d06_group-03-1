using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleBrands.DTOs;

namespace MoveVN.Application.Modules.VehicleBrands.Interfaces;

public interface IVehicleBrandService
{
    Task<PagedResult<VehicleBrandResponse>> GetAllAsync(string? keyword, string? sortBy, string? vehicleType, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<VehicleBrandResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleBrandResponse> CreateAsync(CreateVehicleBrandRequest request, CancellationToken cancellationToken = default);
    Task<VehicleBrandResponse> UpdateAsync(int id, UpdateVehicleBrandRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
