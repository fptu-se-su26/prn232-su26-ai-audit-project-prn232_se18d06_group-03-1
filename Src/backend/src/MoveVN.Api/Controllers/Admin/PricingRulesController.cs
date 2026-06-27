using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.PricingRules.DTOs;
using MoveVN.Application.Modules.PricingRules.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/pricing-rules")]
public class PricingRulesController : BaseApiController
{
    private readonly IPricingRuleService _service;

    public PricingRulesController(IPricingRuleService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PricingRuleResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] long? vehicleId,
        [FromQuery] string? ruleType,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Success(await _service.GetAllAsync(keyword, vehicleId, ruleType, isActive, page, pageSize, cancellationToken));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<PricingRuleResponse>>> GetById(long id, CancellationToken cancellationToken = default)
        => Success(await _service.GetByIdAsync(id, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PricingRuleResponse>>> Create(CreatePricingRuleRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.CreateAsync(request, cancellationToken));

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ApiResponse<PricingRuleResponse>>> Update(long id, UpdatePricingRuleRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(long id, CancellationToken cancellationToken = default)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
