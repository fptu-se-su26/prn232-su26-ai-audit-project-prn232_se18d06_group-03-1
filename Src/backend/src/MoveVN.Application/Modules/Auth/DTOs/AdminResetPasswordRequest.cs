namespace MoveVN.Application.Modules.Auth.DTOs;

public class AdminResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
