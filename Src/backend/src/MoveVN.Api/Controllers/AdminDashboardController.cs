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
        // 1. Total Completed Bookings
        var completedBookings = await _context.Bookings
            .Where(b => b.Status == "Completed")
            .ToListAsync(ct);

        var totalCompletedBookings = completedBookings.Count;

        // 2. Total platform revenue (sum of PlatformFee from Completed bookings)
        var totalRevenue = completedBookings.Sum(b => b.PlatformFee);

        // 3. Total Booking Amount (sum of TotalAmount from Completed bookings)
        var totalBookingValue = completedBookings.Sum(b => b.TotalAmount);

        // 4. Total Deposit collected (sum of DepositAmount from Completed bookings)
        var totalDeposit = completedBookings.Sum(b => b.DepositAmount);

        // 5. Total pending withdrawal amount
        var pendingWithdrawalAmount = await _context.WithdrawalRequests
            .Where(w => w.Status == "Pending")
            .SumAsync(w => w.Amount, ct);

        var pendingWithdrawalCount = await _context.WithdrawalRequests
            .Where(w => w.Status == "Pending")
            .CountAsync(ct);

        // 6. Recent 10 Bookings
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
            RecentBookings = recentBookings
        });
    }
}
