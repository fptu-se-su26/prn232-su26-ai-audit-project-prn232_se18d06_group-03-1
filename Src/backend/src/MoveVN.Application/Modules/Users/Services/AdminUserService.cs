using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;

namespace MoveVN.Application.Modules.Users.Services;

public class AdminUserService : IAdminUserService
{
    private readonly IAdminUserRepository _repo;
    private readonly IAuditLogService _auditLog;

    public AdminUserService(IAdminUserRepository repo, IAuditLogService auditLog)
    {
        _repo = repo;
        _auditLog = auditLog;
    }

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(string? keyword, string? status, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _repo.GetPagedAsync(keyword, status, page, pageSize, cancellationToken);
    }

    public async Task<AdminUserDto> GetByIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await _repo.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("Người dùng không tồn tại.");
    }

    public async Task UpdateStatusAsync(long userId, UpdateUserStatusRequest request, long adminId, CancellationToken cancellationToken = default)
    {
        var user = await _repo.GetUserEntityAsync(userId, cancellationToken)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        var oldStatus = user.Status;
        user.Status = request.Status;
        _repo.Update(user);
        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _auditLog.LogAsync(adminId, "Admin", $"UpdateUserStatus:{request.Status}",
            "User", userId, oldStatus, request.Status));
    }

    public async Task UpdatePermissionsAsync(long userId, UpdateStaffPermissionsRequest request, long adminId, CancellationToken cancellationToken = default)
    {
        var user = await _repo.GetUserEntityAsync(userId, cancellationToken)
            ?? throw new NotFoundException("NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i.");

        await _repo.ReplaceStaffPermissionsAsync(userId, request.Permissions, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);

        _ = Task.Run(() => _auditLog.LogAsync(adminId, "Admin", "UpdateStaffPermissions",
            "User", user.Id, null, string.Join(",", request.Permissions)));
    }
}
