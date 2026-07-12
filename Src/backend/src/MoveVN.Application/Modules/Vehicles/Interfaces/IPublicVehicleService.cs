using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Vehicles.Interfaces;

public interface IPublicVehicleService
{
    Task<PagedResult<VehicleListItemResponse>> GetAvailableVehiclesAsync(string? type, string? keyword, string? sortBy, int page, int pageSize, int? brandId, int? modelId, string? fuelType, string? seatCount, string? transmission, string? bodyType, string? bikeType, string? engineCapacity, decimal? priceFrom = null, decimal? priceTo = null, string? featureIds = null, DateTime? searchStartDate = null, DateTime? searchEndDate = null, string? brandIds = null, string? transmissions = null, string? fuelTypes = null, string? bodyTypes = null, string? bikeTypes = null, CancellationToken cancellationToken = default);
    Task<VehicleResponse> GetVehicleDetailAsync(long id, CancellationToken cancellationToken = default);
}