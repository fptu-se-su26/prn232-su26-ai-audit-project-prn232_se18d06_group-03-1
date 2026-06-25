using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.DriverLicenseClasses.DTOs;
using MoveVN.Application.Modules.DriverLicenseClasses.Interfaces;

namespace MoveVN.Api.Controllers.Admin;

[Authorize(Roles = "Admin")]
[Route("api/admin/driver-license-classes")]
public class DriverLicenseClassesController : BaseApiController
{
    private readonly IDriverLicenseClassService _driverLicenseClassService;

    public DriverLicenseClassesController(IDriverLicenseClassService driverLicenseClassService)
    {
        _driverLicenseClassService = driverLicenseClassService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DriverLicenseClassResponse>>>> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? sortBy,
        [FromQuery] string? systemVersion,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseClassService.GetAllAsync(keyword, sortBy, systemVersion, page, pageSize, cancellationToken);
        return Success(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<DriverLicenseClassResponse>>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseClassService.GetByIdAsync(id, cancellationToken);
        return Success(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DriverLicenseClassResponse>>> Create(CreateDriverLicenseClassRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseClassService.CreateAsync(request, cancellationToken);
        return Success(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<DriverLicenseClassResponse>>> Update(int id, UpdateDriverLicenseClassRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _driverLicenseClassService.UpdateAsync(id, request, cancellationToken);
        return Success(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken cancellationToken = default)
    {
        await _driverLicenseClassService.DeleteAsync(id, cancellationToken);
        return Success(new object());
    }
}
