using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.System.DTOs;
using MoveVN.Application.Modules.System.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize(Roles = "Owner,Admin")]
[Route("api/pricing")]
public class PricingController : BaseApiController
{
    private readonly IPricingSuggestionService _pricingSuggestionService;

    public PricingController(IPricingSuggestionService pricingSuggestionService)
    {
        _pricingSuggestionService = pricingSuggestionService;
    }

    [HttpPost("suggest")]
    public async Task<ActionResult<ApiResponse<PricingSuggestionDto>>> Suggest(
        PricingSuggestionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _pricingSuggestionService.SuggestAsync(request, cancellationToken);
        return Ok(ApiResponse<PricingSuggestionDto>.Succeeded(result));
    }
}
