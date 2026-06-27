using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.PlatformFeeRules.DTOs;
using MoveVN.Application.Modules.PlatformFeeRules.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/platform-fee-rules")]
public class PlatformFeeRulesController : BaseApiController
{
    private readonly IPlatformFeeRuleService _service;

    public PlatformFeeRulesController(IPlatformFeeRuleService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PlatformFeeRuleResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? targetType,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Success(await _service.GetAllAsync(keyword, targetType, isActive, page, pageSize, cancellationToken));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<PlatformFeeRuleResponse>>> GetById(long id, CancellationToken cancellationToken = default)
        => Success(await _service.GetByIdAsync(id, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PlatformFeeRuleResponse>>> Create(CreatePlatformFeeRuleRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.CreateAsync(request, cancellationToken));

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ApiResponse<PlatformFeeRuleResponse>>> Update(long id, UpdatePlatformFeeRuleRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(long id, CancellationToken cancellationToken = default)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
