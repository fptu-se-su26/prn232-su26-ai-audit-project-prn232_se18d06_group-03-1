using FluentAssertions;
using MoveVN.Application.Modules.Disputes.Services;

namespace MoveVN.Tests;

public class DisputeWorkflowRulesTests
{
    [Fact]
    public void EvidenceRequestedFromBoth_RequiresBothRoles()
    {
        DisputeWorkflowRules.HaveAllRequestedPartiesResponded("Both", ["Customer"]).Should().BeFalse();
        DisputeWorkflowRules.HaveAllRequestedPartiesResponded("Both", ["Customer", "Owner"]).Should().BeTrue();
    }

    [Fact]
    public void DamageWindow_ClosesFortyEightHoursAfterConfirmation()
    {
        var confirmedAt = new DateTime(2026, 7, 14, 0, 0, 0, DateTimeKind.Utc);
        DisputeWorkflowRules.IsDamageDisputeWindowOpen(confirmedAt.AddHours(-1), confirmedAt, confirmedAt.AddHours(48)).Should().BeTrue();
        DisputeWorkflowRules.IsDamageDisputeWindowOpen(confirmedAt.AddHours(-1), confirmedAt, confirmedAt.AddHours(48).AddSeconds(1)).Should().BeFalse();
    }
}
