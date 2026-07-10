using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenses.DTOs;

namespace MoveVN.Application.Modules.DriverLicenses.Interfaces;

public interface IDriverLicenseService
{
    Task<DriverLicenseStatusResponse> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task<DriverLicenseSubmitResponse> SubmitAsync(Stream image, string fileName, string requestedVehicleType, CancellationToken cancellationToken = default);
    Task<PagedResult<DriverLicenseVerificationListItem>> GetVerificationsAsync(
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<DriverLicenseVerificationRequestDto> GetVerificationByIdAsync(long id, CancellationToken cancellationToken = default);
    Task ApproveAsync(long id, DriverLicenseApproveRequest request, CancellationToken cancellationToken = default);
    Task RejectAsync(long id, string? reason, CancellationToken cancellationToken = default);
    Task RequestMoreInfoAsync(long id, string? reason, CancellationToken cancellationToken = default);
}
