namespace MoveVN.Application.Common.Interfaces;

public interface IDriverLicenseUploadAttemptLimiter
{
    Task<DriverLicenseUploadAttemptState> GetStateAsync(long userId, string vehicleType, CancellationToken cancellationToken = default);
    Task RegisterFailureAsync(long userId, string vehicleType, CancellationToken cancellationToken = default);
    Task RegisterAcceptedAsync(long userId, string vehicleType, CancellationToken cancellationToken = default);
}

public class DriverLicenseUploadAttemptState
{
    public bool IsLocked => LockedUntil.HasValue && LockedUntil.Value > DateTime.UtcNow;
    public DateTime? LockedUntil { get; set; }
    public int ConsecutiveFailures { get; set; }
    public int DailyFailures { get; set; }
}
