using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Banners.DTOs;
using MoveVN.Application.Modules.Banners.Interfaces;

namespace MoveVN.Api.Controllers;

[ApiController]
[Route("api/banners")]
public class BannersController : ControllerBase
{
    private readonly IBannerService _service;

    public BannersController(IBannerService service) => _service = service;

    [HttpGet("homepage")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<HomepageBannerItem>>>> GetHomepage(CancellationToken ct)
    {
        var result = await _service.GetHomepageAsync(ct);
        return Ok(ApiResponse<List<HomepageBannerItem>>.Succeeded(result));
    }
}
