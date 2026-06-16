using MoveVN.Application.Modules.Contracts.Interfaces;

namespace MoveVN.Infrastructure.Services;

public class PdfGeneratorService : IPdfGeneratorService
{
    public Task<string> GenerateContractAsync(long bookingId, string contractNumber, CancellationToken cancellationToken = default)
    {
        var url = $"https://storage.movevn.com/contracts/{contractNumber}.pdf";
        return Task.FromResult(url);
    }
}
