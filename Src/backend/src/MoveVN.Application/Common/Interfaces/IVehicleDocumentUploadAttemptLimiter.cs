namespace MoveVN.Application.Common.Interfaces;

public interface IVehicleDocumentUploadAttemptLimiter
{
    Task<VehicleDocumentUploadAttemptState> GetStateAsync(long ownerId, CancellationToken cancellationToken = default);
    Task RegisterFailureAsync(long ownerId, CancellationToken cancellationToken = default);
    Task RegisterAcceptedAsync(long ownerId, CancellationToken cancellationToken = default);
}

public class VehicleDocumentUploadAttemptState
{
    public bool IsLocked => LockedUntil.HasValue && LockedUntil.Value > DateTime.UtcNow;
    public DateTime? LockedUntil { get; set; }
    public int ConsecutiveFailures { get; set; }
    public int DailyFailures { get; set; }
}
