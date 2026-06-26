using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.VehicleModelVariants.DTOs;

namespace MoveVN.Application.Modules.VehicleModelVariants.Interfaces;

public interface IVehicleModelVariantService
{
    Task<PagedResult<VehicleModelVariantResponse>> GetAllAsync(string? keyword, string? sortBy, string? vehicleType, int? brandId, int? modelId, string? bodyType, byte? seatCount, string? transmission, string? fuelType, string? bikeType, string? engineCapacity, int? requiredLicenseClassId, string? licenseSystemVersion, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<VehicleModelVariantResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleModelVariantResponse> CreateAsync(CreateVehicleModelVariantRequest request, CancellationToken cancellationToken = default);
    Task<VehicleModelVariantResponse> UpdateAsync(int id, UpdateVehicleModelVariantRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
