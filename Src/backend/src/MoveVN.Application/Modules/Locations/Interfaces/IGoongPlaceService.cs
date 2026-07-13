using MoveVN.Application.Modules.Locations.DTOs;

namespace MoveVN.Application.Modules.Locations.Interfaces;

public interface IGoongPlaceService
{
    Task<GoongPlaceAutocompleteResponse> AutocompleteAsync(string input, int limit = 5, CancellationToken cancellationToken = default);
    Task<GoongPlaceDetailResponse> GetDetailAsync(string placeId, CancellationToken cancellationToken = default);
}
