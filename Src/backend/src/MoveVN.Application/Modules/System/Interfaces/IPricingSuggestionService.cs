using MoveVN.Application.Modules.System.DTOs;

namespace MoveVN.Application.Modules.System.Interfaces;

public interface IPricingSuggestionService
{
    Task<PricingSuggestionDto> SuggestAsync(PricingSuggestionRequest request, CancellationToken cancellationToken = default);
}
