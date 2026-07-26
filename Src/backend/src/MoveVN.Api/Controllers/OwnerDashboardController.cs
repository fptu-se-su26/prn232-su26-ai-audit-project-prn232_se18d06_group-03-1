using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Infrastructure.Persistence;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Owner")]
[ApiController]
[Route("api/owner/dashboard")]
public class OwnerDashboardController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public OwnerDashboardController(AppDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<object>>> GetStats(CancellationToken cancellationToken)
    {
        var ownerId = _currentUser.UserId!.Value;
        var now = DateTime.UtcNow;
        var currentMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var revenueTrendStart = currentMonth.AddMonths(-5);
        var bookings = _context.Bookings.AsNoTracking().Where(booking => booking.OwnerId == ownerId);
        var completedBookings = bookings.Where(booking => booking.Status == "Completed");

        var totalBookings = await bookings.CountAsync(cancellationToken);
        var completedCount = await completedBookings.CountAsync(cancellationToken);
        var pendingCount = await bookings.CountAsync(booking => booking.Status == "Pending", cancellationToken);
        var activeCount = await bookings.CountAsync(
            booking => booking.Status == "Approved"
                || booking.Status == "DepositPaid"
                || booking.Status == "Confirmed"
                || booking.Status == "InProgress",
            cancellationToken);
        var totalRevenue = await completedBookings
            .SumAsync(booking => (decimal?)booking.TotalAmount, cancellationToken) ?? 0;
        var totalVehicles = await _context.Vehicles.AsNoTracking()
            .CountAsync(vehicle => vehicle.OwnerId == ownerId, cancellationToken);
        var approvedVehicles = await _context.Vehicles.AsNoTracking()
            .CountAsync(vehicle => vehicle.OwnerId == ownerId && vehicle.Status == "Approved", cancellationToken);

        var revenueTrendRaw = await completedBookings
            .Where(booking => booking.UpdatedAt >= revenueTrendStart)
            .GroupBy(booking => new { booking.UpdatedAt.Year, booking.UpdatedAt.Month })
            .Select(group => new
            {
                group.Key.Year,
                group.Key.Month,
                Value = group.Sum(booking => booking.TotalAmount)
            })
            .ToListAsync(cancellationToken);
        var monthlyRevenue = Enumerable.Range(0, 6)
            .Select(index =>
            {
                var month = revenueTrendStart.AddMonths(index);
                return new
                {
                    Month = month.ToString("yyyy-MM"),
                    Label = $"T{month.Month}",
                    Value = revenueTrendRaw
                        .FirstOrDefault(item => item.Year == month.Year && item.Month == month.Month)?.Value ?? 0
                };
            })
            .ToList();
        var recentBookings = await bookings
            .OrderByDescending(booking => booking.UpdatedAt)
            .Take(5)
            .Select(booking => new
            {
                booking.Id,
                booking.BookingCode,
                booking.StartDate,
                booking.EndDate,
                booking.TotalAmount,
                booking.Status,
                booking.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Success<object>(new
        {
            TotalRevenue = totalRevenue,
            TotalBookings = totalBookings,
            CompletedCount = completedCount,
            ActiveCount = activeCount,
            PendingCount = pendingCount,
            OtherCount = Math.Max(0, totalBookings - completedCount - activeCount - pendingCount),
            TotalVehicles = totalVehicles,
            ApprovedVehicles = approvedVehicles,
            MonthlyRevenue = monthlyRevenue,
            RecentBookings = recentBookings
        });
    }
}
