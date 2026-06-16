using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Reviews.DTOs;
using MoveVN.Application.Modules.Reviews.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Reviews;

public class ReviewRepository : IReviewRepository
{
    private readonly AppDbContext _context;

    public ReviewRepository(AppDbContext context) => _context = context;

    public async Task<bool> ExistsAsync(long bookingId, long reviewerId, CancellationToken ct = default)
        => await _context.Reviews.AnyAsync(r => r.BookingId == bookingId && r.ReviewerId == reviewerId, ct);

    public async Task<Booking?> GetBookingAsync(long bookingId, CancellationToken ct = default)
        => await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct);

    public async Task AddAsync(Review review, CancellationToken ct = default)
        => await _context.Reviews.AddAsync(review, ct);

    public async Task<List<ReviewResponse>> GetByVehicleAsync(long vehicleId, CancellationToken ct = default)
        => await _context.Reviews.Where(r => r.VehicleId == vehicleId)
            .Select(r => new ReviewResponse { Id = r.Id }).ToListAsync(ct);

    public async Task UpdateVehicleRatingAsync(long vehicleId, CancellationToken ct = default)
    {
        var ratings = await _context.Reviews.Where(r => r.VehicleId == vehicleId).ToListAsync(ct);
        // Update vehicle average rating - implementation depends on Vehicle entity having AvgRating field
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
