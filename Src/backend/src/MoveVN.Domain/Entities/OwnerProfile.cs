namespace MoveVN.Domain.Entities;

public class OwnerProfile
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountHolderName { get; set; }
    public string Tier { get; set; } = "Standard";
    public decimal CommissionRate { get; set; } = 15.00m;
    public int TotalTrips { get; set; }
    public decimal? AverageRating { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
}

