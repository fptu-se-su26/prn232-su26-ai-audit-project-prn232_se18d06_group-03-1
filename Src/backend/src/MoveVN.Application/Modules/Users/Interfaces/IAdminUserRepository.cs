using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Users.Interfaces;

public interface IAdminUserRepository
{
    Task<PagedResult<AdminUserDto>> GetPagedAsync(string? keyword, string? status, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminUserDto?> GetByIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<User?> GetUserEntityAsync(long userId, CancellationToken cancellationToken = default);
    void Update(User user);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
