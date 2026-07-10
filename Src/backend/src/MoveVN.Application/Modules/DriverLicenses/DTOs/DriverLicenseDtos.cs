using MoveVN.Application.Common.Models;

namespace MoveVN.Application.Modules.DriverLicenses.DTOs;

public class DriverLicenseStatusResponse
{
    public bool Verified { get; set; }
    public string Status { get; set; } = "None";
    public string? DriverLicenseNumber { get; set; }
    public string? LicenseClass { get; set; }
    public List<string> VerifiedVehicleTypes { get; set; } = [];
    public DateTime? VerifiedAt { get; set; }
    public DateTime? CanUpdateAfter { get; set; }
    public DriverLicenseVerificationRequestDto? LatestRequest { get; set; }
}

public class DriverLicenseSubmitResponse
{
    public string Status { get; set; } = string.Empty;
    public bool Verified { get; set; }
    public string? Message { get; set; }
    public string? DriverLicenseNumber { get; set; }
    public string? LicenseClass { get; set; }
    public string? RequestedVehicleType { get; set; }
    public List<string> VerifiedVehicleTypes { get; set; } = [];
    public decimal? OcrConfidence { get; set; }
    public List<string> Flags { get; set; } = [];
}

public class DriverLicenseVerificationRequestDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string? UserFullName { get; set; }
    public string? UserEmail { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? FrontImageUrl { get; set; }
    public string? RequestedVehicleType { get; set; }
    public string? ExternalProvider { get; set; }
    public string? ExternalResultJson { get; set; }
    public decimal? Confidence { get; set; }
    public string? DecisionReason { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public long? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DriverLicenseVerificationListItem
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? Confidence { get; set; }
    public string? DecisionReason { get; set; }
    public string? LicenseClass { get; set; }
    public string? RequestedVehicleType { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DriverLicenseReviewActionRequest
{
    public string? Reason { get; set; }
}

public class DriverLicenseVerificationQuery
{
    public string? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class DriverLicenseVerificationQueryResult
{
    public PagedResult<DriverLicenseVerificationListItem> Items { get; set; } = new();
}
