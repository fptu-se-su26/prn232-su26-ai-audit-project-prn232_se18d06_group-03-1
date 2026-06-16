using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Vehicles.DTOs;
using MoveVN.Application.Modules.Vehicles.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Vehicles;

public class BlockedDateRepository : IBlockedDateRepository
{
    private readonly AppDbContext _context;

    public BlockedDateRepository(AppDbContext context) => _context = context;

    public async Task<BlockedDate?> GetByIdAsync(long id, CancellationToken ct = default)
        => await _context.BlockedDates.FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task AddAsync(BlockedDate blocked, CancellationToken ct = default)
        => await _context.BlockedDates.AddAsync(blocked, ct);

    public void Remove(BlockedDate blocked) => _context.BlockedDates.Remove(blocked);

    public async Task<Vehicle?> GetVehicleAsync(long vehicleId, CancellationToken ct = default)
        => await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId, ct);

    public async Task<bool> HasBookingOverlapAsync(long vehicleId, DateOnly from, DateOnly to, CancellationToken ct = default)
        => await _context.Bookings.AnyAsync(b => b.VehicleId == vehicleId && b.Status != "Cancelled" && b.Status != "Rejected" && b.StartDate < to && b.EndDate > from, ct);

    public async Task<List<BlockedDateDto>> GetByVehicleAsync(long vehicleId, CancellationToken ct = default)
        => await _context.BlockedDates.Where(b => b.VehicleId == vehicleId)
            .Select(b => new BlockedDateDto { Id = b.Id, VehicleId = b.VehicleId, DateFrom = b.StartDate, DateTo = b.EndDate, Reason = b.Reason, CreatedAt = b.CreatedAt })
            .ToListAsync(ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
