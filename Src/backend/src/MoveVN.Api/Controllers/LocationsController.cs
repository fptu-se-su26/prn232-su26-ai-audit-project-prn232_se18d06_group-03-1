using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Locations.DTOs;
using MoveVN.Application.Modules.Locations.Interfaces;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/locations")]
public class LocationsController : BaseApiController
{
    private readonly IGoongPlaceService _goongPlaceService;

    public LocationsController(IGoongPlaceService goongPlaceService)
    {
        _goongPlaceService = goongPlaceService;
    }

    [HttpGet("goong/autocomplete")]
    public async Task<ActionResult<ApiResponse<GoongPlaceAutocompleteResponse>>> Autocomplete(
        [FromQuery] string input,
        [FromQuery] int limit = 5,
        CancellationToken cancellationToken = default)
    {
        var result = await _goongPlaceService.AutocompleteAsync(input, limit, cancellationToken);
        return Success(result);
    }

    [HttpGet("goong/detail")]
    public async Task<ActionResult<ApiResponse<GoongPlaceDetailResponse>>> Detail(
        [FromQuery] string placeId,
        CancellationToken cancellationToken = default)
    {
        var result = await _goongPlaceService.GetDetailAsync(placeId, cancellationToken);
        return Success(result);
    }
}
