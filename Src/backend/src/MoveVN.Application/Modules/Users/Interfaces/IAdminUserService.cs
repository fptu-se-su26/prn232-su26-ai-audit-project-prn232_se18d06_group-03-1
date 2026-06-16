using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Users.DTOs;

namespace MoveVN.Application.Modules.Users.Interfaces;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserDto>> GetUsersAsync(string? keyword, string? status, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminUserDto> GetByIdAsync(long userId, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(long userId, UpdateUserStatusRequest request, long adminId, CancellationToken cancellationToken = default);
}
