using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Contracts.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Infrastructure.Persistence.Repositories.Contracts;

public class ContractRepository : IContractRepository
{
    private readonly AppDbContext _context;

    public ContractRepository(AppDbContext context) => _context = context;

    public async Task<Contract?> GetByBookingAsync(long bookingId, CancellationToken ct = default)
        => await _context.Contracts.FirstOrDefaultAsync(c => c.BookingId == bookingId, ct);

    public async Task<Booking?> GetBookingWithDetailsAsync(long bookingId, CancellationToken ct = default)
        => await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct);

    public async Task AddAsync(Contract contract, CancellationToken ct = default)
        => await _context.Contracts.AddAsync(contract, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) => await _context.SaveChangesAsync(ct);
}
