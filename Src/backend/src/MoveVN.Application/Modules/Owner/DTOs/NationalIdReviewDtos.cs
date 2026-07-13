namespace MoveVN.Application.Modules.Owner.DTOs;

public class NationalIdVerificationListItem
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? Confidence { get; set; }
    public string? DecisionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class NationalIdVerificationDetailDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? FrontImageUrl { get; set; }
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

public class NationalIdReviewActionRequest
{
    public string Reason { get; set; } = string.Empty;
}
