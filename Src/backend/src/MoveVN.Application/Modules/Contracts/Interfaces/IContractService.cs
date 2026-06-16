using MoveVN.Application.Modules.Contracts.DTOs;

namespace MoveVN.Application.Modules.Contracts.Interfaces;

public interface IContractService
{
    Task<ContractResponse> GenerateAsync(long bookingId, CancellationToken cancellationToken = default);
    Task<ContractResponse?> GetByBookingAsync(long bookingId, CancellationToken cancellationToken = default);
}
