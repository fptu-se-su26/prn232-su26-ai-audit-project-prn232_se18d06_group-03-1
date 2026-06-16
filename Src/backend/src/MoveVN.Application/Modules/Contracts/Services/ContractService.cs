using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Contracts.DTOs;
using MoveVN.Application.Modules.Contracts.Interfaces;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Modules.Contracts.Services;

public class ContractService : IContractService
{
    private readonly IContractRepository _repo;
    private readonly IPdfGeneratorService _pdfGenerator;

    public ContractService(IContractRepository repo, IPdfGeneratorService pdfGenerator)
    {
        _repo = repo;
        _pdfGenerator = pdfGenerator;
    }

    public async Task<ContractResponse> GenerateAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        var existing = await _repo.GetByBookingAsync(bookingId, cancellationToken);
        if (existing is not null)
            return MapToDto(existing);

        var booking = await _repo.GetBookingWithDetailsAsync(bookingId, cancellationToken)
            ?? throw new NotFoundException("Booking không tồn tại.");

        var contractNumber = $"CTR{DateTime.UtcNow:yyyyMMdd}{booking.Id:D6}";
        var pdfUrl = await _pdfGenerator.GenerateContractAsync(bookingId, contractNumber, cancellationToken);

        var contract = new Contract
        {
            BookingId = bookingId,
            ContractNumber = contractNumber,
            PdfUrl = pdfUrl
        };

        await _repo.AddAsync(contract, cancellationToken);
        await _repo.SaveChangesAsync(cancellationToken);
        return MapToDto(contract);
    }

    public async Task<ContractResponse?> GetByBookingAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        var contract = await _repo.GetByBookingAsync(bookingId, cancellationToken);
        return contract is null ? null : MapToDto(contract);
    }

    private static ContractResponse MapToDto(Contract c) => new()
    {
        Id = c.Id,
        BookingId = c.BookingId,
        ContractNumber = c.ContractNumber,
        PdfUrl = c.PdfUrl,
        CustomerSignedAt = c.CustomerSignedAt,
        OwnerSignedAt = c.OwnerSignedAt,
        CreatedAt = c.CreatedAt
    };
}
