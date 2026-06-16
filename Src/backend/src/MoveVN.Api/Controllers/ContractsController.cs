using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Contracts.DTOs;
using MoveVN.Application.Modules.Contracts.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/contracts")]
public class ContractsController : BaseApiController
{
    private readonly IContractService _contractService;

    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    [HttpGet("booking/{bookingId:long}")]
    public async Task<ActionResult<ApiResponse<ContractResponse>>> GetByBooking(
        long bookingId,
        CancellationToken cancellationToken)
    {
        var result = await _contractService.GetByBookingAsync(bookingId, cancellationToken);
        if (result is null)
            return NotFound(ApiResponse<ContractResponse>.Failed("Contract not found."));
        return Ok(ApiResponse<ContractResponse>.Succeeded(result));
    }

    [HttpGet("{id:long}/download")]
    public async Task<ActionResult<ApiResponse<string>>> Download(
        long id,
        CancellationToken cancellationToken)
    {
        var result = await _contractService.GetByBookingAsync(id, cancellationToken);
        if (result?.PdfUrl is null)
            return NotFound(ApiResponse<string>.Failed("Contract PDF not found."));
        return Ok(ApiResponse<string>.Succeeded(result.PdfUrl));
    }
}
