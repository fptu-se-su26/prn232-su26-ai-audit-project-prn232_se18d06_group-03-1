namespace MoveVN.Application.Modules.DriverLicenses;

/// <summary>
/// Pure business rule for the driver-license update cooldown.
/// Backend is the source of truth; the frontend only reflects the evaluation.
/// All timestamps are UTC. The countdown is anchored at the most recent
/// update submission (<see cref="MoveVN.Domain.Entities.CustomerDriverLicense.LastSubmittedAt"/>).
/// </summary>
public static class DriverLicenseCooldown
{
    public const int DRIVER_LICENSE_COOLDOWN_DAYS = 7;

    private static readonly HashSet<string> ResubmitBypassStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Rejected",
        "Reject",
        "Failed",
        "NeedMoreInfo",
    };

    public sealed record CooldownEvaluation(
        bool IsAllowed,
        DateTime? NextAllowedSubmitAt,
        long? RemainingCooldownSeconds);

    /// <summary>
    /// Case B (pending) always blocks. Terminal non-verified statuses
    /// (Rejected/Reject/Failed/NeedMoreInfo) bypass the cooldown so the user
    /// can resubmit immediately. Otherwise the 7-day cooldown from the last
    /// submission applies. A missing submission timestamp means no cooldown.
    /// </summary>
    public static CooldownEvaluation Evaluate(
        DateTime? lastSubmittedAt,
        string? latestRequestStatus,
        bool hasPending,
        DateTime utcNow)
    {
        if (hasPending)
        {
            return new CooldownEvaluation(false, null, null);
        }

        if (latestRequestStatus is not null && ResubmitBypassStatuses.Contains(latestRequestStatus))
        {
            return new CooldownEvaluation(true, null, null);
        }

        if (lastSubmittedAt is null)
        {
            return new CooldownEvaluation(true, null, null);
        }

        var nextAllowed = lastSubmittedAt.Value.AddDays(DRIVER_LICENSE_COOLDOWN_DAYS);
        if (nextAllowed <= utcNow)
        {
            return new CooldownEvaluation(true, null, null);
        }

        return new CooldownEvaluation(
            false,
            nextAllowed,
            (long)Math.Ceiling((nextAllowed - utcNow).TotalSeconds));
    }

    public static string FormatRemaining(long totalSeconds)
    {
        var remaining = Math.Max(0, totalSeconds);
        var days = remaining / 86400;
        var hours = (remaining % 86400) / 3600;
        var minutes = (remaining % 3600) / 60;
        if (days > 0)
        {
            return $"{days} ngày {hours} giờ {minutes} phút";
        }
        if (hours > 0)
        {
            return $"{hours} giờ {minutes} phút";
        }
        if (minutes > 0)
        {
            return $"{minutes} phút";
        }
        return $"{remaining} giây";
    }
}
