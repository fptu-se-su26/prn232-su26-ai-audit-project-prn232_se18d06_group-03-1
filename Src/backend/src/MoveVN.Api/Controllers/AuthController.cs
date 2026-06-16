using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MoveVN.Api.Controllers;

[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly IAuthLogService _authLogService;
    private readonly ICurrentUserContext _currentUser;

    public AuthController(IAuthService authService, IAuthLogService authLogService, ICurrentUserContext currentUser)
    {
        _authService = authService;
        _authLogService = authLogService;
        _currentUser = currentUser;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        return Ok(ApiResponse<AuthResponse>.Succeeded(result, "Registered successfully."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        return Ok(ApiResponse<AuthResponse>.Succeeded(result, "Logged in successfully."));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<AuthUserResponse>>> Me(CancellationToken cancellationToken)
    {
        var result = await _authService.GetCurrentUserAsync(cancellationToken);
        return Ok(ApiResponse<AuthUserResponse>.Succeeded(result));
    }

    [HttpGet("verify-email")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyEmail(
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        await _authService.VerifyEmailAsync(token, cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(null, "Email verified successfully."));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Refresh(
        RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(request, cancellationToken);
        return Ok(ApiResponse<AuthResponse>.Succeeded(result, "Token refreshed successfully."));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<object>>> Logout(CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(null, "Logged out successfully."));
    }

    [Authorize]
    [HttpDelete("sessions")]
    public async Task<ActionResult<ApiResponse<object>>> RevokeAllSessions(CancellationToken cancellationToken)
    {
        await _authService.RevokeAllSessionsAsync(cancellationToken);
        return Ok(ApiResponse<object>.Succeeded(null, "All sessions revoked successfully."));
    }

    [Authorize]
    [HttpGet("login-history")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AuthLogDto>>>> GetLoginHistory(CancellationToken cancellationToken)
    {
        var userId = _currentUser.DomainUserId!.Value;
        var result = await _authLogService.GetUserLoginHistoryAsync(userId, 10, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AuthLogDto>>.Succeeded(result));
    }
}
