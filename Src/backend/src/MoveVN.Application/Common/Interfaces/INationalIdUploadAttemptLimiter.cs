namespace MoveVN.Application.Common.Interfaces;

public interface INationalIdUploadAttemptLimiter
{
    Task<NationalIdUploadAttemptState> GetStateAsync(long userId, CancellationToken cancellationToken = default);
    Task RegisterFailureAsync(long userId, CancellationToken cancellationToken = default);
    Task RegisterAcceptedAsync(long userId, CancellationToken cancellationToken = default);
}

public class NationalIdUploadAttemptState
{
    public bool IsLocked => LockedUntil.HasValue && LockedUntil.Value > DateTime.UtcNow;
    public DateTime? LockedUntil { get; set; }
    public int ConsecutiveFailures { get; set; }
    public int DailyFailures { get; set; }
}
