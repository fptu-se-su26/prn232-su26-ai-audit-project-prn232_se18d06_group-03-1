using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenseClasses.DTOs;

namespace MoveVN.Application.Modules.DriverLicenseClasses.Interfaces;

public interface IDriverLicenseClassService
{
    Task<PagedResult<DriverLicenseClassResponse>> GetAllAsync(string? keyword, string? sortBy, string? systemVersion, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<DriverLicenseClassResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<DriverLicenseClassResponse> CreateAsync(CreateDriverLicenseClassRequest request, CancellationToken cancellationToken = default);
    Task<DriverLicenseClassResponse> UpdateAsync(int id, UpdateDriverLicenseClassRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
