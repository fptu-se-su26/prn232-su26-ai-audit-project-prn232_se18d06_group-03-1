using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.VehicleModelVariants.DTOs;
using MoveVN.Application.Modules.VehicleModelVariants.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.VehicleModelVariants.Services;

public class VehicleModelVariantService : IVehicleModelVariantService
{
    private readonly IVehicleCatalogRepository _repository;

    public VehicleModelVariantService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<VehicleModelVariantResponse>> GetAllAsync(
        string? keyword,
        string? sortBy,
        string? vehicleType,
        int? brandId,
        int? modelId,
        string? bodyType,
        byte? seatCount,
        string? transmission,
        string? fuelType,
        string? bikeType,
        string? engineCapacity,
        int? requiredLicenseClassId,
        string? licenseSystemVersion,
        bool? isActive,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var normalizedVehicleType = NormalizeVehicleType(vehicleType);
        var query = _repository.VehicleModelVariants;

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(kw)
                || _repository.VehicleModels.Any(m => m.Id == x.ModelId && m.Name.ToLower().Contains(kw))
                || _repository.VehicleModels.Any(m => m.Id == x.ModelId
                    && _repository.VehicleBrands.Any(b => b.Id == m.BrandId && b.Name.ToLower().Contains(kw))));
        }

        if (!string.IsNullOrWhiteSpace(normalizedVehicleType))
        {
            query = normalizedVehicleType == "Motorbike"
                ? query.Where(x => x.VehicleType == "Motorbike" || x.VehicleType == "Motorcycle")
                : query.Where(x => x.VehicleType == normalizedVehicleType);
        }

        if (brandId.HasValue)
        {
            query = query.Where(x => _repository.VehicleModels.Any(m => m.Id == x.ModelId && m.BrandId == brandId.Value));
        }

        if (modelId.HasValue)
            query = query.Where(x => x.ModelId == modelId.Value);

        if (!string.IsNullOrWhiteSpace(bodyType))
            query = query.Where(x => x.BodyType == bodyType);

        if (seatCount.HasValue)
            query = query.Where(x => x.SeatCount == seatCount.Value);

        if (!string.IsNullOrWhiteSpace(transmission))
            query = query.Where(x => x.Transmission == transmission);

        if (!string.IsNullOrWhiteSpace(fuelType))
            query = query.Where(x => x.FuelType == fuelType);

        if (!string.IsNullOrWhiteSpace(bikeType))
            query = query.Where(x => x.BikeType == bikeType);

        if (!string.IsNullOrWhiteSpace(engineCapacity))
            query = query.Where(x => x.EngineCapacity != null && x.EngineCapacity.Contains(engineCapacity));

        if (requiredLicenseClassId.HasValue)
            query = query.Where(x => x.RequiredLicenseClassId == requiredLicenseClassId.Value);

        if (!string.IsNullOrWhiteSpace(licenseSystemVersion))
        {
            query = query.Where(x => x.RequiredLicenseClassId.HasValue
                && _repository.DriverLicenseClasses.Any(d => d.Id == x.RequiredLicenseClassId.Value && d.SystemVersion == licenseSystemVersion));
        }

        query = sortBy switch
        {
            "name_asc" => query.OrderBy(x => x.Name),
            "name_desc" => query.OrderByDescending(x => x.Name),
            _ => query.OrderByDescending(x => x.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var query2 = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        var items = await query2.Select(x => new VehicleModelVariantResponse
        {
            Id = x.Id,
            ModelId = x.ModelId,
            ModelName = _repository.VehicleModels.Where(m => m.Id == x.ModelId).Select(m => m.Name).FirstOrDefault() ?? "",
            BrandId = _repository.VehicleModels.Where(m => m.Id == x.ModelId).Select(m => m.BrandId).FirstOrDefault(),
            BrandName = _repository.VehicleModels.Where(m => m.Id == x.ModelId).Select(m => _repository.VehicleBrands.Where(b => b.Id == m.BrandId).Select(b => b.Name).FirstOrDefault()).FirstOrDefault() ?? "",
            Name = x.Name,
            VehicleType = x.VehicleType,
            SeatCount = x.SeatCount,
            Transmission = x.Transmission,
            FuelType = x.FuelType,
            BodyType = x.BodyType,
            Drivetrain = x.Drivetrain,
            BikeType = x.BikeType,
            EngineCapacity = x.EngineCapacity,
            RequiredLicenseClassId = x.RequiredLicenseClassId,
            RequiredLicenseClassCode = x.RequiredLicenseClassId.HasValue
                ? _repository.DriverLicenseClasses.Where(d => d.Id == x.RequiredLicenseClassId.Value).Select(d => d.Code).FirstOrDefault()
                : null,
            RequiredLicenseClassDisplayName = x.RequiredLicenseClassId.HasValue
                ? _repository.DriverLicenseClasses.Where(d => d.Id == x.RequiredLicenseClassId.Value).Select(d => d.DisplayName).FirstOrDefault()
                : null,
            RequiredLicenseClassSystemVersion = x.RequiredLicenseClassId.HasValue
                ? _repository.DriverLicenseClasses.Where(d => d.Id == x.RequiredLicenseClassId.Value).Select(d => d.SystemVersion).FirstOrDefault()
                : null,
            IsActive = x.IsActive,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt
        })
            .ToListAsync(cancellationToken);

        return new PagedResult<VehicleModelVariantResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<VehicleModelVariantResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleModelVariantByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_VARIANT_NOT_FOUND);

        var model = await _repository.VehicleModels.FirstOrDefaultAsync(m => m.Id == entity.ModelId, cancellationToken);
        var brandName = model != null
            ? await _repository.VehicleBrands.Where(b => b.Id == model.BrandId).Select(b => b.Name).FirstOrDefaultAsync(cancellationToken) ?? ""
            : "";
        var license = entity.RequiredLicenseClassId.HasValue
            ? await _repository.DriverLicenseClasses.FirstOrDefaultAsync(d => d.Id == entity.RequiredLicenseClassId.Value, cancellationToken)
            : null;

        return new VehicleModelVariantResponse
        {
            Id = entity.Id,
            ModelId = entity.ModelId,
            ModelName = model?.Name ?? "",
            BrandId = model?.BrandId ?? 0,
            BrandName = brandName,
            Name = entity.Name,
            VehicleType = entity.VehicleType,
            SeatCount = entity.SeatCount,
            Transmission = entity.Transmission,
            FuelType = entity.FuelType,
            BodyType = entity.BodyType,
            Drivetrain = entity.Drivetrain,
            BikeType = entity.BikeType,
            EngineCapacity = entity.EngineCapacity,
            RequiredLicenseClassId = entity.RequiredLicenseClassId,
            RequiredLicenseClassCode = license?.Code,
            RequiredLicenseClassDisplayName = license?.DisplayName,
            RequiredLicenseClassSystemVersion = license?.SystemVersion,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<VehicleModelVariantResponse> CreateAsync(CreateVehicleModelVariantRequest request, CancellationToken cancellationToken = default)
    {
        var model = await _repository.VehicleModels.FirstOrDefaultAsync(x => x.Id == request.ModelId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        if (!model.IsActive)
            throw new AppException(ErrorCode.VEHICLE_MODEL_INACTIVE);
        var vehicleType = NormalizeVehicleType(request.VehicleType);
        await ValidateVariantReferencesAsync(model.BrandId, vehicleType, request.RequiredLicenseClassId, cancellationToken);

        var entity = new VehicleModelVariant
        {
            ModelId = request.ModelId,
            Name = request.Name.Trim(),
            VehicleType = vehicleType,
            SeatCount = request.SeatCount,
            Transmission = request.Transmission,
            FuelType = request.FuelType,
            BodyType = request.BodyType,
            Drivetrain = request.Drivetrain,
            BikeType = request.BikeType,
            EngineCapacity = request.EngineCapacity,
            RequiredLicenseClassId = request.RequiredLicenseClassId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<VehicleModelVariantResponse> UpdateAsync(int id, UpdateVehicleModelVariantRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleModelVariantByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_VARIANT_NOT_FOUND);

        var model = await _repository.VehicleModels.FirstOrDefaultAsync(x => x.Id == request.ModelId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        if (!model.IsActive && request.IsActive)
            throw new AppException(ErrorCode.VEHICLE_MODEL_INACTIVE);
        var vehicleType = NormalizeVehicleType(request.VehicleType);
        await ValidateVariantReferencesAsync(model.BrandId, vehicleType, request.RequiredLicenseClassId, cancellationToken);

        entity.ModelId = request.ModelId;
        entity.Name = request.Name.Trim();
        entity.VehicleType = vehicleType;
        entity.SeatCount = request.SeatCount;
        entity.Transmission = request.Transmission;
        entity.FuelType = request.FuelType;
        entity.BodyType = request.BodyType;
        entity.Drivetrain = request.Drivetrain;
        entity.BikeType = request.BikeType;
        entity.EngineCapacity = request.EngineCapacity;
        entity.RequiredLicenseClassId = request.RequiredLicenseClassId;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetVehicleModelVariantByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_MODEL_VARIANT_NOT_FOUND);

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync(cancellationToken);
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

    private async Task ValidateVariantReferencesAsync(int brandId, string vehicleType, int? requiredLicenseClassId, CancellationToken cancellationToken)
    {
        var brand = await _repository.VehicleBrands.FirstOrDefaultAsync(x => x.Id == brandId, cancellationToken)
            ?? throw new AppException(ErrorCode.VEHICLE_BRAND_NOT_FOUND);

        if (!string.IsNullOrWhiteSpace(vehicleType) && NormalizeVehicleType(brand.VehicleType) != vehicleType)
        {
            throw new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND);
        }

        if (requiredLicenseClassId.HasValue)
        {
            var licenseExists = await _repository.DriverLicenseClasses.AnyAsync(x => x.Id == requiredLicenseClassId.Value, cancellationToken);
            if (!licenseExists)
            {
                throw new AppException(ErrorCode.DRIVER_LICENSE_CLASS_NOT_FOUND);
            }
        }
    }
}
