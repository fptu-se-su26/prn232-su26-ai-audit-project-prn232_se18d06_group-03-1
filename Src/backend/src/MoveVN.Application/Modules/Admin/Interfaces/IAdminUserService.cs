using MoveVN.Application.Modules.Admin.DTOs;
using MoveVN.Application.Modules.Auth.DTOs;

namespace MoveVN.Application.Modules.Admin.Interfaces;

public interface IAdminUserService
{
    Task<AuthUserResponse> CreateStaffAsync(CreateStaffRequest request, CancellationToken cancellationToken = default);
}
