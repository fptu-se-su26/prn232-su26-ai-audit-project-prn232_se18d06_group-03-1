using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehicleModels.DTOs;
using MoveVN.Application.Modules.VehicleModels.Interfaces;

namespace MoveVN.Application.Modules.VehicleModels.Services;

public class VehicleModelService : IVehicleModelService
{
    private readonly IVehicleCatalogRepository _repository;

    public VehicleModelService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<VehicleModelResponse>> GetAllAsync(string? keyword, string? sortBy, string? vehicleType, int? brandId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.VehicleModels;
        var normalizedVehicleType = NormalizeVehicleType(vehicleType);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(kw));
        }

        if (!string.IsNullOrWhiteSpace(normalizedVehicleType))
        {
            query = normalizedVehicleType == "Motorbike"
                ? query.Where(x => _repository.VehicleBrands.Any(b => b.Id == x.BrandId && (b.VehicleType == "Motorbike" || b.VehicleType == "Motorcycle")))
                : query.Where(x => _repository.VehicleBrands.Any(b => b.Id == x.BrandId && b.VehicleType == normalizedVehicleType));
        }

        if (brandId.HasValue)
            query = query.Where(x => x.BrandId == brandId.Value);

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
            .Select(x => new VehicleModelResponse
            {
                Id = x.Id,
                BrandId = x.BrandId,
                BrandName = _repository.VehicleBrands.Where(b => b.Id == x.BrandId).Select(b => b.Name).FirstOrDefault() ?? "",
                VehicleType = _repository.VehicleBrands.Where(b => b.Id == x.BrandId).Select(b => b.VehicleType).FirstOrDefault() ?? "",
                Name = x.Name,
                IsActive = x.IsActive,
                VariantCount = _repository.VehicleModelVariants.Count(v => v.ModelId == x.Id)
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<VehicleModelResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<VehicleModelResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleModelByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        var brandName = await _repository.VehicleBrands
            .Where(b => b.Id == entity.BrandId)
            .Select(b => b.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? "";
        var vehicleType = await _repository.VehicleBrands
            .Where(b => b.Id == entity.BrandId)
            .Select(b => b.VehicleType)
            .FirstOrDefaultAsync(cancellationToken) ?? "";

        return new VehicleModelResponse
        {
            Id = entity.Id,
            BrandId = entity.BrandId,
            BrandName = brandName,
            VehicleType = vehicleType,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task<VehicleModelResponse> CreateAsync(CreateVehicleModelRequest request, CancellationToken cancellationToken = default)
    {
        var brand = await _repository.VehicleBrands.FirstOrDefaultAsync(x => x.Id == request.BrandId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        if (!brand.IsActive)
            throw new AppException(ErrorCode.VEHICLE_BRAND_INACTIVE);

        var entity = new Domain.Entities.VehicleModel
        {
            BrandId = request.BrandId,
            Name = request.Name.Trim(),
            IsActive = true
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);

        var brandName = await _repository.VehicleBrands
            .Where(b => b.Id == entity.BrandId)
            .Select(b => b.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? "";
        var vehicleType = await _repository.VehicleBrands
            .Where(b => b.Id == entity.BrandId)
            .Select(b => b.VehicleType)
            .FirstOrDefaultAsync(cancellationToken) ?? "";

        return new VehicleModelResponse
        {
            Id = entity.Id,
            BrandId = entity.BrandId,
            BrandName = brandName,
            VehicleType = vehicleType,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task<ModelCascadeInfoResponse> GetCascadeInfoAsync(int id, CancellationToken cancellationToken = default)
    {
        var exists = await _repository.VehicleModels.AnyAsync(x => x.Id == id, cancellationToken);
        if (!exists)
            throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        var variantCount = await _repository.VehicleModelVariants
            .CountAsync(x => x.ModelId == id && x.IsActive, cancellationToken);

        return new ModelCascadeInfoResponse(variantCount);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleModelByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        entity.IsActive = false;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<VehicleModelResponse> UpdateAsync(int id, UpdateVehicleModelRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleModelByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);

        var brand = await _repository.VehicleBrands.FirstOrDefaultAsync(x => x.Id == request.BrandId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);
        if (!brand.IsActive && request.IsActive)
            throw new AppException(ErrorCode.VEHICLE_BRAND_INACTIVE);

        var wasActive = entity.IsActive;
        entity.BrandId = request.BrandId;
        entity.Name = request.Name.Trim();
        entity.IsActive = request.IsActive;

        if (wasActive && !request.IsActive)
        {
            var activeVariants = await _repository.VehicleModelVariants
                .Where(v => v.ModelId == id && v.IsActive)
                .ToListAsync(cancellationToken);
            foreach (var variant in activeVariants)
                variant.IsActive = false;
        }

        await _repository.SaveChangesAsync(cancellationToken);

        var brandName = await _repository.VehicleBrands
            .Where(b => b.Id == entity.BrandId)
            .Select(b => b.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? "";
        var vehicleType = await _repository.VehicleBrands
            .Where(b => b.Id == entity.BrandId)
            .Select(b => b.VehicleType)
            .FirstOrDefaultAsync(cancellationToken) ?? "";

        return new VehicleModelResponse
        {
            Id = entity.Id,
            BrandId = entity.BrandId,
            BrandName = brandName,
            VehicleType = vehicleType,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task<List<VehicleModelResponse>> GetByBrandIdAsync(int brandId, CancellationToken cancellationToken = default)
    {
        var brandName = await _repository.VehicleBrands
            .Where(b => b.Id == brandId)
            .Select(b => b.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? "";

        return await _repository.VehicleModels
            .Where(x => x.BrandId == brandId)
            .Select(x => new VehicleModelResponse
            {
                Id = x.Id,
                BrandId = x.BrandId,
                BrandName = brandName,
                VehicleType = _repository.VehicleBrands.Where(b => b.Id == x.BrandId).Select(b => b.VehicleType).FirstOrDefault() ?? "",
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);
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
