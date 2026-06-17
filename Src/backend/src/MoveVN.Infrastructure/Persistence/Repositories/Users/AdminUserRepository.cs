using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Users;

public class AdminUserRepository : IAdminUserRepository
{
    private readonly AppDbContext _context;

    public AdminUserRepository(AppDbContext context) => _context = context;

    public async Task<PagedResult<AdminUserDto>> GetPagedAsync(string? keyword, string? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrEmpty(keyword)) query = query.Where(u => u.Email.Contains(keyword) || u.FullName.Contains(keyword));
        if (!string.IsNullOrEmpty(status)) query = query.Where(u => u.Status == status);
        var total = await query.CountAsync(ct);
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var userIds = users.Select(u => u.Id).ToList();
        var roleLookup = await _context.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
            .GroupBy(x => x.UserId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(x => x.Name).ToList(), ct);

        var permissionLookup = await _context.StaffPermissions
            .Where(sp => userIds.Contains(sp.UserId))
            .GroupBy(sp => sp.UserId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(x => x.PermissionCode).ToList(), ct);

        var items = users.Select(u => new AdminUserDto
        {
            Id = u.Id,
            Email = u.Email,
            FullName = u.FullName,
            Phone = u.Phone,
            Status = u.Status,
            IsEmailVerified = u.IsEmailVerified,
            CreatedAt = u.CreatedAt,
            Roles = roleLookup.GetValueOrDefault(u.Id) ?? new List<string>(),
            Permissions = permissionLookup.GetValueOrDefault(u.Id) ?? new List<string>()
        }).ToList();
        return PagedResult<AdminUserDto>.Create(items, total, page, pageSize);
    }

    public async Task<AdminUserDto?> GetByIdAsync(long userId, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return null;

        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (_, r) => r.Name)
            .ToListAsync(ct);

        var permissions = await _context.StaffPermissions
            .Where(sp => sp.UserId == userId)
            .Select(sp => sp.PermissionCode)
            .ToListAsync(ct);

        return new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Status = user.Status,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt,
            Roles = roles,
            Permissions = permissions
        };
    }

    public async Task<User?> GetUserEntityAsync(long userId, CancellationToken ct = default)
        => await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

    public async Task ReplaceStaffPermissionsAsync(long userId, IEnumerable<string> permissions, CancellationToken ct = default)
    {
        var existing = await _context.StaffPermissions.Where(x => x.UserId == userId).ToListAsync(ct);
        if (existing.Count > 0)
            _context.StaffPermissions.RemoveRange(existing);

        var normalized = permissions
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase);

        foreach (var permission in normalized)
        {
            await _context.StaffPermissions.AddAsync(new StaffPermission
            {
                UserId = userId,
                PermissionCode = permission
            }, ct);
        }
    }

    public void Update(User user) => _context.Users.Update(user);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
