using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.PricingRegions.DTOs;
using MoveVN.Application.Modules.PricingRegions.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/pricing-regions")]
public class PricingRegionsController : BaseApiController
{
    private readonly IPricingRegionService _service;

    public PricingRegionsController(IPricingRegionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PricingRegionResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Success(await _service.GetAllAsync(keyword, sortBy, isActive, page, pageSize, cancellationToken));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PricingRegionResponse>>> GetById(int id, CancellationToken cancellationToken = default)
        => Success(await _service.GetByIdAsync(id, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PricingRegionResponse>>> Create(CreatePricingRegionRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.CreateAsync(request, cancellationToken));

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PricingRegionResponse>>> Update(int id, UpdatePricingRegionRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
