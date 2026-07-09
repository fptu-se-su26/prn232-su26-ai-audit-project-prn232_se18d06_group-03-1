namespace MoveVN.Application.Common.Interfaces;

public interface IDriverLicenseVerificationLogService
{
    Task LogAsync(DriverLicenseVerificationLogEntry entry, CancellationToken cancellationToken = default);
}

public class DriverLicenseVerificationLogEntry
{
    public long UserId { get; set; }
    public long? VerificationRequestId { get; set; }
    public string Provider { get; set; } = "AI_VERIFICATION";
    public string DocumentType { get; set; } = "DriverLicense";
    public object? Request { get; set; }
    public object? Response { get; set; }
    public string? Recommendation { get; set; }
    public List<string> Flags { get; set; } = [];
    public decimal? OcrConfidence { get; set; }
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }
    public string? FilePublicId { get; set; }
    public DateTime? FileDeletedAt { get; set; }
    public string? DeletionReason { get; set; }
}
