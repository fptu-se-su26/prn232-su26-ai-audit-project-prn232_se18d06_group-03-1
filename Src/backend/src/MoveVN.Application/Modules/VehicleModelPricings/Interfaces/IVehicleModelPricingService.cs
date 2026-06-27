using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleModelPricings.DTOs;

namespace MoveVN.Application.Modules.VehicleModelPricings.Interfaces;

public interface IVehicleModelPricingService
{
    Task<PagedResult<VehicleModelPricingResponse>> GetAllAsync(string? keyword, string? sortBy, string? vehicleType, int? brandId, int? modelId, int? pricingRegionId, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<VehicleModelPricingResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModelPricingResponse> CreateAsync(CreateVehicleModelPricingRequest request, CancellationToken cancellationToken = default);
    Task<VehicleModelPricingResponse> UpdateAsync(int id, UpdateVehicleModelPricingRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
