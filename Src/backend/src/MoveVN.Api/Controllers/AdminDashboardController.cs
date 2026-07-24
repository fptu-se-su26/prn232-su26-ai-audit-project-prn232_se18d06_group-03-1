using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Admin,Staff")]
[ApiController]
[Route("api/admin/dashboard")]
public class AdminDashboardController : BaseApiController
{
    private readonly AppDbContext _context;

    public AdminDashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<object>>> GetStats(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var trendStart = today.AddDays(-13);
        var revenueTrendStart = monthStart.AddMonths(-5);

        var totalCompletedBookings = await _context.Bookings.CountAsync(b => b.Status == "Completed", ct);
        var totalBookings = await _context.Bookings.CountAsync(ct);
        var pendingBookings = await _context.Bookings.CountAsync(b => b.Status == "Pending", ct);
        var activeBookings = await _context.Bookings.CountAsync(
            b => b.Status == "Approved" || b.Status == "DepositPaid" || b.Status == "Confirmed" || b.Status == "InProgress",
            ct);

        var totalRevenue = await _context.Bookings
            .Where(b => b.Status == "Completed")
            .SumAsync(b => (decimal?)b.PlatformFee, ct) ?? 0;

        var totalBookingValue = await _context.Bookings
            .Where(b => b.Status == "Completed")
            .SumAsync(b => (decimal?)b.TotalAmount, ct) ?? 0;

        var totalDeposit = await _context.Bookings
            .Where(b => b.Status == "Completed")
            .SumAsync(b => (decimal?)b.DepositAmount, ct) ?? 0;

        var monthlyRevenue = await _context.Bookings
            .Where(b => b.Status == "Completed" && b.UpdatedAt >= monthStart)
            .SumAsync(b => (decimal?)b.PlatformFee, ct) ?? 0;

        var monthlyBookingValue = await _context.Bookings
            .Where(b => b.Status == "Completed" && b.UpdatedAt >= monthStart)
            .SumAsync(b => (decimal?)b.TotalAmount, ct) ?? 0;

        var pendingWithdrawalAmount = await _context.WithdrawalRequests
            .Where(w => w.Status == "Pending")
            .SumAsync(w => (decimal?)w.Amount, ct) ?? 0;

        var pendingWithdrawalCount = await _context.WithdrawalRequests
            .Where(w => w.Status == "Pending")
            .CountAsync(ct);

        var totalUsers = await _context.Users.CountAsync(ct);
        var activeUsers = await _context.Users.CountAsync(u => u.Status == "Active", ct);
        var onlineUsers = await _context.Users.CountAsync(u => u.IsOnline, ct);
        var totalVehicles = await _context.Vehicles.CountAsync(ct);
        var approvedVehicles = await _context.Vehicles.CountAsync(v => v.Status == "Approved", ct);
        var pendingVehicles = await _context.Vehicles.CountAsync(v => v.Status == "Pending", ct);
        var openDisputes = await _context.Disputes.CountAsync(d => d.Status != "Resolved", ct);
        var totalDisputes = await _context.Disputes.CountAsync(ct);
        var supportTicketsOpen = await _context.SupportTickets.CountAsync(t => t.Status == "Open" || t.Status == "InProgress", ct);
        var unreadNotifications = await _context.Notifications.CountAsync(n => !n.IsRead, ct);
        var todayBookings = await _context.Bookings.CountAsync(b => b.CreatedAt >= today, ct);

        var bookingStatusBreakdown = await _context.Bookings
            .GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        var vehicleStatusBreakdown = await _context.Vehicles
            .GroupBy(v => v.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        var bookingTrendRaw = await _context.Bookings
            .Where(b => b.CreatedAt >= trendStart)
            .GroupBy(b => b.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var bookingTrend = Enumerable.Range(0, 14)
            .Select(index =>
            {
                var date = trendStart.AddDays(index);
                return new
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    Count = bookingTrendRaw.FirstOrDefault(x => x.Date == date)?.Count ?? 0
                };
            })
            .ToList();

        var revenueTrendRaw = await _context.Bookings
            .Where(b => b.Status == "Completed" && b.UpdatedAt >= revenueTrendStart)
            .GroupBy(b => new { b.UpdatedAt.Year, b.UpdatedAt.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Revenue = g.Sum(x => x.PlatformFee),
                BookingValue = g.Sum(x => x.TotalAmount)
            })
            .ToListAsync(ct);

        var revenueTrend = Enumerable.Range(0, 6)
            .Select(index =>
            {
                var month = revenueTrendStart.AddMonths(index);
                var item = revenueTrendRaw.FirstOrDefault(x => x.Year == month.Year && x.Month == month.Month);
                return new
                {
                    Month = month.ToString("MM/yyyy"),
                    Revenue = item?.Revenue ?? 0,
                    BookingValue = item?.BookingValue ?? 0
                };
            })
            .ToList();

        var recentBookings = await _context.Bookings
            .OrderByDescending(b => b.UpdatedAt)
            .Take(10)
            .Select(b => new
            {
                b.Id,
                b.BookingCode,
                b.Status,
                b.DepositAmount,
                b.PlatformFee,
                b.TotalAmount,
                b.UpdatedAt
            })
            .ToListAsync(ct);

        return Success<object>(new
        {
            TotalCompletedBookings = totalCompletedBookings,
            TotalRevenue = totalRevenue,
            TotalBookingValue = totalBookingValue,
            TotalDeposit = totalDeposit,
            PendingWithdrawalAmount = pendingWithdrawalAmount,
            PendingWithdrawalCount = pendingWithdrawalCount,
            TotalBookings = totalBookings,
            PendingBookings = pendingBookings,
            ActiveBookings = activeBookings,
            TodayBookings = todayBookings,
            MonthlyRevenue = monthlyRevenue,
            MonthlyBookingValue = monthlyBookingValue,
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            OnlineUsers = onlineUsers,
            TotalVehicles = totalVehicles,
            ApprovedVehicles = approvedVehicles,
            PendingVehicles = pendingVehicles,
            OpenDisputes = openDisputes,
            TotalDisputes = totalDisputes,
            DisputeRate = totalBookings == 0 ? 0 : Math.Round((decimal)totalDisputes / totalBookings * 100, 2),
            SupportTicketsOpen = supportTicketsOpen,
            UnreadNotifications = unreadNotifications,
            BookingStatusBreakdown = bookingStatusBreakdown,
            VehicleStatusBreakdown = vehicleStatusBreakdown,
            BookingTrend = bookingTrend,
            RevenueTrend = revenueTrend,
            RecentBookings = recentBookings
        });
    }
}
