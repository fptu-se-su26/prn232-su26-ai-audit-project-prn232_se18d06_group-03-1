namespace MoveVN.Application.Common.Interfaces;

public interface IVehicleVerificationLogQueryService
{
    Task<List<VehicleVerificationLogSummary>> GetByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default);
}

public class VehicleVerificationLogSummary
{
    public string? Id { get; set; }
    public long VehicleId { get; set; }
    public long VehicleDocumentId { get; set; }
    public string? Recommendation { get; set; }
    public List<string> Flags { get; set; } = [];
    public decimal? OcrConfidence { get; set; }
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }
    public string Provider { get; set; } = "AI_VERIFICATION";
    public string? Action { get; set; }
    public long? ActorUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
