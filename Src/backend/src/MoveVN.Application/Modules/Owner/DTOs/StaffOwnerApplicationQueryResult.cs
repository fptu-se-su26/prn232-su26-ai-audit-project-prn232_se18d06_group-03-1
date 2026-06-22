namespace MoveVN.Application.Modules.Owner.DTOs;

public class StaffOwnerApplicationQueryResult
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserPhone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool NationalIdVerified { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
}
