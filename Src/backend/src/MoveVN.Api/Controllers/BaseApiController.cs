using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Models;

namespace MoveVN.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected ActionResult<ApiResponse<T>> Success<T>(T? data, string message = "Success.")
    {
        return Ok(ApiResponse<T>.Succeeded(data, message, ErrorCode.SUCCESS.Code));
    }
}
