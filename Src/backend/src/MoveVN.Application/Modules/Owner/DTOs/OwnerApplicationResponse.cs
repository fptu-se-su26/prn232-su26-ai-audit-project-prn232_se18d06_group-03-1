namespace MoveVN.Application.Modules.Owner.DTOs;

public class OwnerApplicationResponse
{
    public long Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool NationalIdVerified { get; set; }
    public bool BankInfoCompleted { get; set; }
    public bool IsOwner { get; set; }
    public string NextStep { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? NationalIdNumber { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountHolderName { get; set; }
    public string? FrontImageUrl { get; set; }
    public string? BackImageUrl { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
