using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.CmsPages.DTOs;
using MoveVN.Application.Modules.CmsPages.Interfaces;

namespace MoveVN.Api.Controllers;

[Route("api/cms-pages")]
public class CmsPagesController : BaseApiController
{
    private readonly ICmsPageService _service;

    public CmsPagesController(ICmsPageService service)
    {
        _service = service;
    }

    [HttpGet("navigation")]
    public async Task<ActionResult<ApiResponse<List<CmsPageNavigationItem>>>> GetNavigation(CancellationToken cancellationToken = default)
        => Success(await _service.GetNavigationAsync(cancellationToken));

    [HttpGet("{slug}")]
    public async Task<ActionResult<ApiResponse<CmsPageResponse?>>> GetBySlug(string slug, CancellationToken cancellationToken = default)
        => Success(await _service.GetBySlugAsync(slug, cancellationToken));
}
