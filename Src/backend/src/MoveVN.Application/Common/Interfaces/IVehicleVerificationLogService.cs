namespace MoveVN.Application.Common.Interfaces;

public interface IVehicleVerificationLogService
{
    Task LogAsync(VehicleVerificationLogEntry entry, CancellationToken cancellationToken = default);
}

public class VehicleVerificationLogEntry
{
    public long VehicleId { get; set; }
    public long VehicleDocumentId { get; set; }
    public long OwnerId { get; set; }
    public string Provider { get; set; } = "AI_VERIFICATION";
    public string DocumentType { get; set; } = "VehicleRegistration";
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
