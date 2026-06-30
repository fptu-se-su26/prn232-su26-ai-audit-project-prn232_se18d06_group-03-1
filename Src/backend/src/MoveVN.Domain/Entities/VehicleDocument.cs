using MoveVN.Domain.Enums;

namespace MoveVN.Domain.Entities;

public class VehicleDocument
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public string DocType { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? FilePublicId { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public bool Verified { get; set; }
    public bool IsCurrent { get; set; } = true;
    public VehicleDocumentVerificationStatus VerificationStatus { get; set; } = VehicleDocumentVerificationStatus.Pending;
    public string? VerificationProvider { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? DecisionReason { get; set; }
    public string? OcrLicensePlate { get; set; }
    public string? OcrBrand { get; set; }
    public string? OcrModel { get; set; }
    public string? OcrEngineNumber { get; set; }
    public string? OcrChassisNumber { get; set; }
    public decimal? OcrConfidence { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeleteReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
