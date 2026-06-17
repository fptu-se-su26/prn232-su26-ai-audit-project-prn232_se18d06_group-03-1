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
        var bookingsInMonth = _context.Bookings.Where(b => b.CreatedAt >= start && b.CreatedAt < end);
        var totalBookingsInMonth = await bookingsInMonth.CountAsync(ct);
        var totalDisputes = await _context.Disputes.CountAsync(d => d.CreatedAt >= start && d.CreatedAt < end, ct);
        var highRiskBookings = await _context.Bookings.CountAsync(b => b.CreatedAt >= start && b.CreatedAt < end && (b.RiskScore ?? 0) >= 70, ct);

        return new DashboardKpiDto
        {
            TotalUsers = (int)await _context.Users.LongCountAsync(ct),
            TotalVehiclesAvailable = await _context.Vehicles.CountAsync(v => v.Status == "Available", ct),
            BookingsToday = totalBookingsInMonth,
            GmvThisMonth = await _context.Payments.Where(p => p.CreatedAt >= start && p.CreatedAt < end && p.Status == "Paid")
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0,
            DisputeRate = totalBookingsInMonth == 0 ? 0 : Math.Round((double)totalDisputes / totalBookingsInMonth, 2),
            HighRiskBookings = highRiskBookings,
            HighRiskRatio = totalBookingsInMonth == 0 ? 0 : Math.Round((decimal)highRiskBookings / totalBookingsInMonth, 2),
            DailyBookings = await bookingsInMonth
                .GroupBy(b => b.CreatedAt.Date)
                .Select(g => new DailyBookingDto
                {
                    Date = g.Key,
                    Count = g.Count(),
                    Revenue = g.Sum(x => x.TotalAmount)
                })
                .OrderBy(x => x.Date)
                .ToListAsync(ct)
        };
    }

    public async Task<List<DailyBookingDto>> GetOwnerRevenueAsync(long ownerId, int year, int month, CancellationToken ct = default)
    {
        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);
        return await _context.Bookings.Where(b => b.OwnerId == ownerId && b.CreatedAt >= start && b.CreatedAt < end)
            .GroupBy(b => b.CreatedAt.Date)
            .Select(g => new DailyBookingDto { Date = g.Key, Count = g.Count(), Revenue = g.Sum(x => x.TotalAmount) })
            .OrderBy(x => x.Date)
            .ToListAsync(ct);
    }
}
