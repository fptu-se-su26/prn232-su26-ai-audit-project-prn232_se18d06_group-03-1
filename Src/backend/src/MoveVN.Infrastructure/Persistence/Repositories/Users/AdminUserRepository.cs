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
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new AdminUserDto { Id = u.Id }).ToListAsync(ct);
        return PagedResult<AdminUserDto>.Create(items, total, page, pageSize);
    }

    public async Task<AdminUserDto?> GetByIdAsync(long userId, CancellationToken ct = default)
        => await _context.Users.Where(u => u.Id == userId)
            .Select(u => new AdminUserDto { Id = u.Id }).FirstOrDefaultAsync(ct);

    public async Task<User?> GetUserEntityAsync(long userId, CancellationToken ct = default)
        => await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

    public void Update(User user) => _context.Users.Update(user);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
