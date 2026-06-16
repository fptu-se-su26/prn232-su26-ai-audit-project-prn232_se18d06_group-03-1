using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Payments.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> FindByIdempotencyKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<Payment?> FindByBookingAsync(long bookingId, CancellationToken cancellationToken = default);
    Task AddAsync(Payment payment, CancellationToken cancellationToken = default);
    void Update(Payment payment);
    Task<Booking?> GetBookingAsync(long bookingId, CancellationToken cancellationToken = default);
    void UpdateBooking(Booking booking);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
