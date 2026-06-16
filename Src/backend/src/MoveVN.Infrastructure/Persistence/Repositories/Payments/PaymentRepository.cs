using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Payments;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _context;

    public PaymentRepository(AppDbContext context) => _context = context;

    public async Task<Payment?> FindByIdempotencyKeyAsync(string key, CancellationToken ct = default)
        => await _context.Payments.FirstOrDefaultAsync(p => p.IdempotencyKey == key, ct);

    public async Task<Payment?> FindByBookingAsync(long bookingId, CancellationToken ct = default)
        => await _context.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId, ct);

    public async Task AddAsync(Payment payment, CancellationToken ct = default)
        => await _context.Payments.AddAsync(payment, ct);

    public void Update(Payment payment) => _context.Payments.Update(payment);

    public async Task<Booking?> GetBookingAsync(long bookingId, CancellationToken ct = default)
        => await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct);

    public void UpdateBooking(Booking booking) => _context.Bookings.Update(booking);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
