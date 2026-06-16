namespace MoveVN.Application.Modules.Auth.Interfaces;

public interface IRateLimitService
{
    /// <summary>Returns true if login is locked for this email.</summary>
    Task<bool> IsLoginLockedAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>Record a failed login attempt. Returns remaining attempts before lock.</summary>
    Task<int> RecordLoginFailAsync(string email, CancellationToken cancellationToken = default);

    Task ResetLoginAttemptsAsync(string email, CancellationToken cancellationToken = default);
}
