namespace MoveVN.Application.Modules.Owner.DTOs;

public class OwnerApplicationResponse
{
    public long Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool NationalIdVerified { get; set; }
    public bool BankInfoCompleted { get; set; }
    public bool IsOwner { get; set; }
    public string NextStep { get; set; } = string.Empty;
}
