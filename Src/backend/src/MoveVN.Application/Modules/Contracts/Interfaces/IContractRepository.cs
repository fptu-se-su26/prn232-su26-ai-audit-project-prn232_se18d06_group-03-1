using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Contracts.Interfaces;

public interface IContractRepository
{
    Task<Contract?> GetByBookingAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<Booking?> GetBookingWithDetailsAsync(long bookingId, CancellationToken cancellationToken = default);
    Task AddAsync(Contract contract, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IPdfGeneratorService
{
    Task<string> GenerateContractAsync(long bookingId, string contractNumber, CancellationToken cancellationToken = default);
}
