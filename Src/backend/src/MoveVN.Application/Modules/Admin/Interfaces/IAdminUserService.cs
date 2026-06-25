using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Admin.Interfaces;

public interface IAdminUserService
{
    Task<List<AdminUserListItem>> GetUsersAsync(string? keyword, CancellationToken cancellationToken = default);
    Task<AuthUserResponse> CreateStaffAsync(CreateStaffRequest request, CancellationToken cancellationToken = default);
    Task<AuthUserResponse> CreateOwnerAsync(AdminCreateOwnerRequest request, CancellationToken cancellationToken = default);
}
