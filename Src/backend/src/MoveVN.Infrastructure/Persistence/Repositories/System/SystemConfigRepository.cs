using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.System.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.System;

public class SystemConfigRepository : ISystemConfigRepository
{
    private readonly AppDbContext _context;

    public SystemConfigRepository(AppDbContext context) => _context = context;

    public async Task<List<SystemConfig>> GetAllAsync(CancellationToken ct = default)
        => await _context.SystemConfigs.ToListAsync(ct);

    public async Task<SystemConfig?> GetByKeyAsync(string key, CancellationToken ct = default)
        => await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == key, ct);

    public void Update(SystemConfig config) => _context.SystemConfigs.Update(config);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
