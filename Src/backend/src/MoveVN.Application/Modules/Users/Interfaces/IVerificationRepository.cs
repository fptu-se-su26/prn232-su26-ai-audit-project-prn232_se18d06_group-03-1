using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Users.Interfaces;

public interface IVerificationRepository
{
    Task<VerificationRequest?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<List<VerificationRequest>> GetByUserAsync(long userId, CancellationToken cancellationToken = default);
    Task AddAsync(VerificationRequest verification, CancellationToken cancellationToken = default);
    void Update(VerificationRequest verification);
    Task<PagedResult<VerificationDto>> GetPendingPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
