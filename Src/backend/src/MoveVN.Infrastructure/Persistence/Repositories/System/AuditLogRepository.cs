using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.System;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AppDbContext _context;

    public AuditLogRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(AuditLog log, CancellationToken ct = default)
        => await _context.AuditLogs.AddAsync(log, ct);

    public async Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryRequest request, CancellationToken ct = default)
    {
        var query = _context.AuditLogs.AsQueryable();
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(l => l.CreatedAt).Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
            .Select(l => new AuditLogDto { Id = l.Id }).ToListAsync(ct);
        return PagedResult<AuditLogDto>.Create(items, total, request.Page, request.PageSize);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
