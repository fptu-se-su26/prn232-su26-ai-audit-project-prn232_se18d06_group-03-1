using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.DriverLicenseClasses.DTOs;
using MoveVN.Application.Modules.DriverLicenseClasses.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.DriverLicenseClasses.Services;

public class DriverLicenseClassService : IDriverLicenseClassService
{
    private readonly IVehicleCatalogRepository _repository;

    public DriverLicenseClassService(IVehicleCatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<DriverLicenseClassResponse>> GetAllAsync(string? keyword, string? sortBy, string? systemVersion, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _repository.DriverLicenseClasses;

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(x => x.Code.Contains(keyword) || x.DisplayName.Contains(keyword));

        if (!string.IsNullOrWhiteSpace(systemVersion))
            query = query.Where(x => x.SystemVersion == systemVersion);

        query = sortBy switch
        {
            "code_asc" => query.OrderBy(x => x.Code),
            "code_desc" => query.OrderByDescending(x => x.Code),
            _ => query.OrderByDescending(x => x.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new DriverLicenseClassResponse
            {
                Id = x.Id,
                Code = x.Code,
                DisplayName = x.DisplayName,
                Description = x.Description,
                SystemVersion = x.SystemVersion,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<DriverLicenseClassResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<DriverLicenseClassResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetDriverLicenseClassByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.DRIVER_LICENSE_CLASS_NOT_FOUND);

        return new DriverLicenseClassResponse
        {
            Id = entity.Id,
            Code = entity.Code,
            DisplayName = entity.DisplayName,
            Description = entity.Description,
            SystemVersion = entity.SystemVersion,
            IsActive = entity.IsActive
        };
    }

    public async Task<DriverLicenseClassResponse> CreateAsync(CreateDriverLicenseClassRequest request, CancellationToken cancellationToken = default)
    {
        var entity = new DriverLicenseClass
        {
            Code = request.Code.Trim().ToUpperInvariant(),
            DisplayName = request.DisplayName.Trim(),
            Description = request.Description.Trim(),
            SystemVersion = request.SystemVersion.Trim(),
            IsActive = true
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(cancellationToken);

        return new DriverLicenseClassResponse
        {
            Id = entity.Id,
            Code = entity.Code,
            DisplayName = entity.DisplayName,
            Description = entity.Description,
            SystemVersion = entity.SystemVersion,
            IsActive = entity.IsActive
        };
    }

    public async Task<DriverLicenseClassResponse> UpdateAsync(int id, UpdateDriverLicenseClassRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetDriverLicenseClassByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.DRIVER_LICENSE_CLASS_NOT_FOUND);

        entity.Code = request.Code.Trim().ToUpperInvariant();
        entity.DisplayName = request.DisplayName.Trim();
        entity.Description = request.Description.Trim();
        entity.SystemVersion = request.SystemVersion.Trim();
        entity.IsActive = request.IsActive;

        await _repository.SaveChangesAsync(cancellationToken);

        return new DriverLicenseClassResponse
        {
            Id = entity.Id,
            Code = entity.Code,
            DisplayName = entity.DisplayName,
            Description = entity.Description,
            SystemVersion = entity.SystemVersion,
            IsActive = entity.IsActive
        };
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetDriverLicenseClassByIdAsync(id, cancellationToken)
            ?? throw new AppException(ErrorCode.DRIVER_LICENSE_CLASS_NOT_FOUND);

        entity.IsActive = false;
        await _repository.SaveChangesAsync(cancellationToken);
    }
}
