namespace MoveVN.Application.Modules.Auth.DTOs;

public class ResendOtpRequest
{
    public string Email { get; set; } = string.Empty;
    public string Purpose { get; set; } = "Register";
}
