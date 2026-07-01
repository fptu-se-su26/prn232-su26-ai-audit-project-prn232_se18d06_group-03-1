namespace MoveVN.Domain.Entities;

public class VerificationRequest
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string FrontImagePublicId { get; set; } = string.Empty;
    public string? BackImagePublicId { get; set; }
    public string? FrontImageUrl { get; set; }
    public string? BackImageUrl { get; set; }
    public string? SelfieUrl { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ExternalProvider { get; set; }
    public string? ExternalResultJson { get; set; }
    public decimal? Confidence { get; set; }
    public string? DecisionReason { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public long? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}

