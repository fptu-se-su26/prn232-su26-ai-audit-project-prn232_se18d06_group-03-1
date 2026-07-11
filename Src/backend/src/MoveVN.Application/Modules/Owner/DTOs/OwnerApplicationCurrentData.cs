namespace MoveVN.Application.Modules.Owner.DTOs;

public class OwnerApplicationCurrentData
{
    public long Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountHolderName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? RejectionReason { get; set; }

    public string? UserFullName { get; set; }

    public string? CustomerNationalId { get; set; }
    public bool CustomerNationalIdVerified { get; set; }
    public bool DriverLicenseVerified { get; set; }

    public bool IsOwner { get; set; }
    public string? Email { get; set; }
    public bool IsEmailVerified { get; set; }
}
