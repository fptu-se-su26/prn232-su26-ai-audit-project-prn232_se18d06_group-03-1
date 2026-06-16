using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Users;

public class VerificationRepository : IVerificationRepository
{
    private readonly AppDbContext _context;

    public VerificationRepository(AppDbContext context) => _context = context;

    public async Task<VerificationRequest?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _context.VerificationRequests.FirstOrDefaultAsync(v => v.Id == id, ct);

    public async Task AddAsync(VerificationRequest verification, CancellationToken ct = default)
        => await _context.VerificationRequests.AddAsync(verification, ct);

    public void Update(VerificationRequest verification) => _context.VerificationRequests.Update(verification);

    public async Task<PagedResult<VerificationDto>> GetPendingPagedAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.VerificationRequests.Where(v => v.Status == "Pending").AsQueryable();
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(v => new VerificationDto { Id = v.Id }).ToListAsync(ct);
        return PagedResult<VerificationDto>.Create(items, total, page, pageSize);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
