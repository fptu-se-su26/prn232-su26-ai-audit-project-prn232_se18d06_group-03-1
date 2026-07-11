namespace MoveVN.Domain.Entities;

public class CustomerDriverLicense
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public string? LicenseNumber { get; set; }
    public string? LicenseClass { get; set; }
    public string? FrontImageUrl { get; set; }
    public string? FrontImagePublicId { get; set; }
    public long VerificationRequestId { get; set; }
    public decimal? OcrConfidence { get; set; }
    public DateTime VerifiedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
