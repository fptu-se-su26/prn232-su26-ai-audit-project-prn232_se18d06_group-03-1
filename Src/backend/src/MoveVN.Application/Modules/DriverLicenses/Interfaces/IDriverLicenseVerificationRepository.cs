using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenses.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.DriverLicenses.Interfaces;

public interface IDriverLicenseVerificationRepository
{
    Task<VerificationRequest?> GetLatestByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<VerificationRequest?> GetLatestVerifiedByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<VerificationRequest?> GetPreviousVerifiedByUserIdAsync(long userId, long currentRequestId, string vehicleType, CancellationToken cancellationToken = default);
    Task<VerificationRequest?> GetPendingByUserIdAsync(long userId, string vehicleType, CancellationToken cancellationToken = default);
    Task<VerificationRequest?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task AddAsync(VerificationRequest request, CancellationToken cancellationToken = default);
    void Update(VerificationRequest request);
    Task<PagedResult<DriverLicenseVerificationListItem>> GetPagedAsync(
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<DriverLicenseVerificationRequestDto?> GetDetailAsync(long id, CancellationToken cancellationToken = default);
}
