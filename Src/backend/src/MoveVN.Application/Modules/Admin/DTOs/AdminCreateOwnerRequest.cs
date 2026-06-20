namespace MoveVN.Application.Modules.Admin.DTOs;

public class AdminCreateOwnerRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public string? NationalId { get; set; }
    public bool NationalIdVerified { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountHolderName { get; set; }
}
