namespace MoveVN.Application.Modules.Admin.DTOs;

public class AdminUserDetailDto
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<string> Roles { get; set; } = [];
    public CustomerProfileDto? CustomerProfile { get; set; }
    public OwnerProfileDto? OwnerProfile { get; set; }
    public StaffProfileDto? StaffProfile { get; set; }
    public List<VerificationHistoryDto> VerificationHistory { get; set; } = [];
}

public class CustomerProfileDto
{
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? NationalIdMasked { get; set; }
    public bool NationalIdVerified { get; set; }
    public bool DriverLicenseVerified { get; set; }
    public string? PreferredVehicleType { get; set; }
}

public class OwnerProfileDto
{
    public string Tier { get; set; } = "Standard";
    public decimal CommissionRate { get; set; }
    public int TotalTrips { get; set; }
    public decimal? AverageRating { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountHolderName { get; set; }
}

public class StaffProfileDto
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string? Department { get; set; }
}

public class VerificationHistoryDto
{
    public long Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? Confidence { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
