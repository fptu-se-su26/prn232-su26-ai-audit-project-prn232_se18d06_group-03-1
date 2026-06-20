namespace MoveVN.Application.Modules.Owner.DTOs;

public class StaffOwnerApplicationDetailResponse
{
    public long Id { get; set; }
    public string Status { get; set; } = string.Empty;

    public StaffUserInfo User { get; set; } = new();
    public StaffCustomerProfileInfo CustomerProfile { get; set; } = new();
    public StaffVerificationInfo? VerificationRequest { get; set; }
    public StaffBankInfo BankInfo { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public long? ApprovedBy { get; set; }
    public DateTime? RejectedAt { get; set; }
    public long? RejectedBy { get; set; }
    public string? RejectionReason { get; set; }
}

public class StaffUserInfo
{
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StaffCustomerProfileInfo
{
    public string? NationalId { get; set; }
    public string? NationalIdMasked { get; set; }
    public bool NationalIdVerified { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
}

public class StaffVerificationInfo
{
    public long Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? FrontImageSignedUrl { get; set; }
    public string? BackImageSignedUrl { get; set; }
    public decimal? Confidence { get; set; }
    public string? DecisionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class StaffBankInfo
{
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountHolderName { get; set; }
}
