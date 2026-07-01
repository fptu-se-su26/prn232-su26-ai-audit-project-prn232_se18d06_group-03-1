using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Areas.DTOs;
using MoveVN.Application.Modules.Areas.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/areas")]
public class AreasController : BaseApiController
{
    private readonly IAreaService _service;

    public AreasController(IAreaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AreaResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? province,
        [FromQuery] int? pricingRegionId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Success(await _service.GetAllAsync(keyword, province, pricingRegionId, isActive, page, pageSize, cancellationToken));

    [HttpGet("provinces")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetProvinces(CancellationToken cancellationToken = default)
        => Success(await _service.GetProvincesAsync(cancellationToken));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AreaResponse>>> GetById(int id, CancellationToken cancellationToken = default)
        => Success(await _service.GetByIdAsync(id, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AreaResponse>>> Create(CreateAreaRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.CreateAsync(request, cancellationToken));

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<AreaResponse>>> Update(int id, UpdateAreaRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
