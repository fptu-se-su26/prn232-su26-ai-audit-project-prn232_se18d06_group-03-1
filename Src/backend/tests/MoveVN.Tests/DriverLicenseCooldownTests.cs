using FluentAssertions;
using MoveVN.Application.Modules.DriverLicenses;

namespace MoveVN.Tests;

public class DriverLicenseCooldownTests
{
    private static readonly DateTime Now = new(2026, 9, 15, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void NoSubmission_AllowsUpdate()
    {
        var result = DriverLicenseCooldown.Evaluate(null, null, hasPending: false, Now);

        result.IsAllowed.Should().BeTrue();
        result.NextAllowedSubmitAt.Should().BeNull();
        result.RemainingCooldownSeconds.Should().BeNull();
    }

    [Fact]
    public void Pending_BlocksRegardlessOfAnythingElse()
    {
        var submitted = Now.AddDays(-30);
        var result = DriverLicenseCooldown.Evaluate(submitted, "Rejected", hasPending: true, Now);

        result.IsAllowed.Should().BeFalse();
    }

    [Fact]
    public void Rejected_BypassesCooldown()
    {
        var submitted = Now.AddHours(-1);
        var result = DriverLicenseCooldown.Evaluate(submitted, "Rejected", hasPending: false, Now);

        result.IsAllowed.Should().BeTrue();
    }

    [Fact]
    public void RejectMismatch_BypassesCooldown()
    {
        var submitted = Now.AddHours(-1);
        var result = DriverLicenseCooldown.Evaluate(submitted, "Reject", hasPending: false, Now);

        result.IsAllowed.Should().BeTrue();
    }

    [Fact]
    public void Failed_BypassesCooldown()
    {
        var submitted = Now.AddHours(-1);
        var result = DriverLicenseCooldown.Evaluate(submitted, "Failed", hasPending: false, Now);

        result.IsAllowed.Should().BeTrue();
    }

    [Fact]
    public void NeedMoreInfo_BypassesCooldown()
    {
        var submitted = Now.AddHours(-1);
        var result = DriverLicenseCooldown.Evaluate(submitted, "NeedMoreInfo", hasPending: false, Now);

        result.IsAllowed.Should().BeTrue();
    }

    [Fact]
    public void SixDays23Hours_Blocks_WithOneHourRemaining()
    {
        var submitted = Now.AddDays(-6).AddHours(-23);
        var result = DriverLicenseCooldown.Evaluate(submitted, "Verified", hasPending: false, Now);

        result.IsAllowed.Should().BeFalse();
        result.NextAllowedSubmitAt.Should().Be(submitted.AddDays(7));
        result.RemainingCooldownSeconds.Should().Be(3600);
    }

    [Fact]
    public void OneSecondBeforeExpiry_Blocks()
    {
        var submitted = Now.AddDays(-7).AddSeconds(1);
        var result = DriverLicenseCooldown.Evaluate(submitted, "Verified", hasPending: false, Now);

        result.IsAllowed.Should().BeFalse();
        result.RemainingCooldownSeconds.Should().Be(1);
    }

    [Fact]
    public void ExactBoundary_Allows()
    {
        var submitted = Now.AddDays(-7);
        var result = DriverLicenseCooldown.Evaluate(submitted, "Verified", hasPending: false, Now);

        result.IsAllowed.Should().BeTrue();
        result.NextAllowedSubmitAt.Should().BeNull();
    }

    [Fact]
    public void SevenDaysOneMinute_Allows()
    {
        var submitted = Now.AddDays(-7).AddMinutes(-1);
        var result = DriverLicenseCooldown.Evaluate(submitted, "Verified", hasPending: false, Now);

        result.IsAllowed.Should().BeTrue();
    }

    [Fact]
    public void Constant_IsSevenDays()
    {
        DriverLicenseCooldown.DRIVER_LICENSE_COOLDOWN_DAYS.Should().Be(7);
    }
}
