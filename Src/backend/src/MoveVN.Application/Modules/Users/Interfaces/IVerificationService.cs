using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Users.DTOs;

namespace MoveVN.Application.Modules.Users.Interfaces;

public interface IVerificationService
{
    Task<VerificationDto> SubmitAsync(CreateVerificationRequest request, long userId, CancellationToken cancellationToken = default);
    Task<VerificationDto> ReviewAsync(long verificationId, long staffId, ReviewVerificationRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<VerificationDto>> GetPendingQueueAsync(int page, int pageSize, CancellationToken cancellationToken = default);
}
