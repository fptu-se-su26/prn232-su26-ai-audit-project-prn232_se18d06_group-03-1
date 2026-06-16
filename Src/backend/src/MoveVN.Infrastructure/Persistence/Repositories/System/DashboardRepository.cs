using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;

namespace MoveVN.Infrastructure.Persistence.Repositories.System;

public class DashboardRepository : IDashboardRepository
{
    private readonly AppDbContext _context;

    public DashboardRepository(AppDbContext context) => _context = context;

    public async Task<DashboardKpiDto> GetAdminKpiAsync(int year, int month, CancellationToken ct = default)
    {
        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);
        return new DashboardKpiDto
        {
            TotalUsers = (int)await _context.Users.LongCountAsync(ct),
            TotalVehiclesAvailable = await _context.Vehicles.CountAsync(v => v.Status == "Available", ct),
            BookingsToday = await _context.Bookings.CountAsync(b => b.CreatedAt >= start && b.CreatedAt < end, ct),
            GmvThisMonth = await _context.Payments.Where(p => p.CreatedAt >= start && p.CreatedAt < end && p.Status == "Completed")
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0,
        };
    }

    public async Task<List<DailyBookingDto>> GetOwnerRevenueAsync(long ownerId, int year, int month, CancellationToken ct = default)
    {
        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);
        return await _context.Bookings.Where(b => b.CreatedAt >= start && b.CreatedAt < end)
            .GroupBy(b => b.CreatedAt.Date)
            .Select(g => new DailyBookingDto { Date = g.Key, Count = g.Count() })
            .ToListAsync(ct);
    }
}
