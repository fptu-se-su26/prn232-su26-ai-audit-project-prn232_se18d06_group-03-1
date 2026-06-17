using MoveVN.Application.Common.Models;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Application.Modules.Users.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Authorize]
[Route("api/users")]
public class UsersController : BaseApiController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> GetCurrentProfile(CancellationToken cancellationToken)
    {
        var result = await _userService.GetCurrentProfileAsync(cancellationToken);
        return Ok(ApiResponse<UserResponse>.Succeeded(result));
    }

    [HttpPut("me/profile")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> UpdateCurrentProfile(
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _userService.UpdateCurrentProfileAsync(request, cancellationToken);
        return Ok(ApiResponse<UserResponse>.Succeeded(result, "Profile updated successfully."));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> GetById(long id, CancellationToken cancellationToken)
    {
        var result = await _userService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<UserResponse>.Succeeded(result));
    }}
