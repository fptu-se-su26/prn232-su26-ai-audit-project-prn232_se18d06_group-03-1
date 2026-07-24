using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.CmsPages.DTOs;
using MoveVN.Application.Modules.CmsPages.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/cms-pages")]
public class CmsPagesController : BaseApiController
{
    private readonly ICmsPageService _service;

    public CmsPagesController(ICmsPageService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<CmsPageResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Success(await _service.GetAllAsync(keyword, page, pageSize, cancellationToken));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CmsPageResponse>>> GetById(int id, CancellationToken cancellationToken = default)
        => Success(await _service.GetByIdAsync(id, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CmsPageResponse>>> Create(CreateCmsPageRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.CreateAsync(request, 0, cancellationToken));

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CmsPageResponse>>> Update(int id, UpdateCmsPageRequest request, CancellationToken cancellationToken = default)
        => Success(await _service.UpdateAsync(id, request, 0, cancellationToken));

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
