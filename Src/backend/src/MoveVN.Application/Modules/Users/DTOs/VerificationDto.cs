namespace MoveVN.Application.Modules.Users.DTOs;

public class CreateVerificationRequest
{
    public Microsoft.AspNetCore.Http.IFormFile FrontImage { get; set; } = null!;
    public Microsoft.AspNetCore.Http.IFormFile? BackImage { get; set; }
    public string Type { get; set; } = "CCCD"; // CCCD | DriverLicense
}

public class VerificationDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string FrontImageUrl { get; set; } = string.Empty;
    public string? BackImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ReviewVerificationRequest
{
    public bool Approve { get; set; }
    public string? Reason { get; set; }
}

public class AdminUserDto
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
}

public class UpdateUserStatusRequest
{
    public string Status { get; set; } = string.Empty; // Active | Locked | Banned
    public string? Reason { get; set; }
}
