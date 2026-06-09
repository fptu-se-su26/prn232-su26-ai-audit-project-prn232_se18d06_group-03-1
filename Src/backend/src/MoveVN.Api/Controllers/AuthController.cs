using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Api.Controllers;

[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        return Success(result, "Registered successfully. Please verify OTP.");
    }

    [HttpPost("verify-otp")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyOtp(VerifyOtpRequest request, CancellationToken cancellationToken)
    {
        await _authService.VerifyOtpAsync(request, cancellationToken);
        return Success<object>(null, "OTP verified successfully.");
    }

    [HttpPost("resend-otp")]
    public async Task<ActionResult<ApiResponse<object>>> ResendOtp(ResendOtpRequest request, CancellationToken cancellationToken)
    {
        await _authService.ResendOtpAsync(request, cancellationToken);
        return Success<object>(null, "OTP resent successfully.");
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        return Success(result, "Logged in successfully.");
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(request, cancellationToken);
        return Success(result, "Token refreshed successfully.");
    }

    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<object>>> Logout(LogoutRequest request, CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(request, cancellationToken);
        return Success<object>(null, "Logged out successfully.");
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<object>>> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        await _authService.ForgotPasswordAsync(request, cancellationToken);
        return Success<object>(null, "Password reset OTP sent successfully.");
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        await _authService.ResetPasswordAsync(request, cancellationToken);
        return Success<object>(null, "Password reset successfully.");
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<object>>> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        await _authService.ChangePasswordAsync(request, cancellationToken);
        return Success<object>(null, "Password changed successfully.");
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<AuthUserResponse>>> Me(CancellationToken cancellationToken)
    {
        var result = await _authService.GetCurrentUserAsync(cancellationToken);
        return Success(result);
    }
}
