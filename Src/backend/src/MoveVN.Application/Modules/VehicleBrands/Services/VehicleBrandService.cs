using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehicleBrands.DTOs;
using MoveVN.Application.Modules.VehicleBrands.Interfaces;

namespace MoveVN.Application.Modules.VehicleBrands.Services;

public class VehicleBrandService : IVehicleBrandService
{
    private readonly IVehicleCatalogRepository _repository;

    public VehicleBrandService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<VehicleBrandResponse>> GetAllAsync(string? keyword, string? sortBy, string? vehicleType, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleBrands;
        var normalizedVehicleType = NormalizeVehicleType(vehicleType);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(kw));
        }

        if (!string.IsNullOrWhiteSpace(normalizedVehicleType))
        {
            query = normalizedVehicleType == "Motorbike"
                ? query.Where(x => x.VehicleType == "Motorbike" || x.VehicleType == "Motorcycle")
                : query.Where(x => x.VehicleType == normalizedVehicleType);
        }

        query = sortBy switch
        {
            "name_asc" => query.OrderBy(x => x.Name),
            "name_desc" => query.OrderByDescending(x => x.Name),
            _ => query.OrderByDescending(x => x.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new VehicleBrandResponse
            {
                Id = x.Id,
                Name = x.Name,
                VehicleType = x.VehicleType,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<VehicleBrandResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<VehicleBrandResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleBrandByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);

        return new VehicleBrandResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            VehicleType = entity.VehicleType,
            IsActive = entity.IsActive
        };
    }

    public async Task<VehicleBrandResponse> CreateAsync(CreateVehicleBrandRequest request, CancellationToken cancellationToken = default)
    {
        var entity = new Domain.Entities.VehicleBrand
        {
            Name = request.Name.Trim(),
            VehicleType = NormalizeVehicleType(request.VehicleType),
            IsActive = true
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);

        return new VehicleBrandResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            VehicleType = entity.VehicleType,
            IsActive = entity.IsActive
        };
    }

    public async Task<BrandCascadeInfoResponse> GetCascadeInfoAsync(int id, CancellationToken cancellationToken = default)
    {
        var exists = await _repository.VehicleBrands.AnyAsync(x => x.Id == id, cancellationToken);
        if (!exists)
            throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);

        var modelCount = await _repository.VehicleModels.CountAsync(x => x.BrandId == id && x.IsActive, cancellationToken);
        var modelIds = await _repository.VehicleModels
            .Where(m => m.BrandId == id)
            .Select(m => m.Id)
            .ToListAsync(cancellationToken);
        var variantCount = await _repository.VehicleModelVariants
            .CountAsync(x => modelIds.Contains(x.ModelId) && x.IsActive, cancellationToken);

        return new BrandCascadeInfoResponse(modelCount, variantCount);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleBrandByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);

        entity.IsActive = false;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<VehicleBrandResponse> UpdateAsync(int id, UpdateVehicleBrandRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleBrandByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);

        var wasActive = entity.IsActive;
        entity.Name = request.Name.Trim();
        entity.VehicleType = NormalizeVehicleType(request.VehicleType);
        entity.IsActive = request.IsActive;

        if (wasActive && !request.IsActive)
        {
            var activeModels = await _repository.VehicleModels
                .Where(m => m.BrandId == id && m.IsActive)
                .ToListAsync(cancellationToken);
            foreach (var model in activeModels)
                model.IsActive = false;

            var activeVariantIds = activeModels.Select(m => m.Id).ToList();
            if (activeVariantIds.Count != 0)
            {
                var activeVariants = await _repository.VehicleModelVariants
                    .Where(v => activeVariantIds.Contains(v.ModelId) && v.IsActive)
                    .ToListAsync(cancellationToken);
                foreach (var variant in activeVariants)
                    variant.IsActive = false;
            }
        }

        await _repository.SaveChangesAsync(cancellationToken);

        return new VehicleBrandResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            VehicleType = entity.VehicleType,
            IsActive = entity.IsActive
        };
    }

    private static string NormalizeVehicleType(string? vehicleType)
    {
        if (string.IsNullOrWhiteSpace(vehicleType))
        {
            return string.Empty;
        }

        return vehicleType.Trim().Equals("Motorcycle", StringComparison.OrdinalIgnoreCase)
            ? "Motorbike"
            : vehicleType.Trim();
    }
}
