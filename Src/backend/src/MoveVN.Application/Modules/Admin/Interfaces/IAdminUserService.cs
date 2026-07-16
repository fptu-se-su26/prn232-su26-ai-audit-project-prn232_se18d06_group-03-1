using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Admin.Interfaces;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserListItem>> GetUsersAsync(string? keyword, string? sortBy, string? role, string? status, bool? isOnline, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminUserDetailDto?> GetUserByIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<AuthUserResponse> CreateStaffAsync(CreateStaffRequest request, CancellationToken cancellationToken = default);
    Task<AuthUserResponse> CreateOwnerAsync(AdminCreateOwnerRequest request, CancellationToken cancellationToken = default);
    Task UpdateUserAsync(long userId, AdminUpdateUserRequest request, CancellationToken cancellationToken = default);
    Task UpdateUserRoleAsync(long userId, UpdateUserRoleRequest request, CancellationToken cancellationToken = default);
    Task UpdateUserStatusAsync(long userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default);
}
