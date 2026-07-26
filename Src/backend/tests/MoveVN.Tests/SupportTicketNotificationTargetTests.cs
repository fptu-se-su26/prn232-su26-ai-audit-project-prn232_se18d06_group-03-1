using FluentAssertions;
using MoveVN.Application.Modules.SupportTickets;

namespace MoveVN.Tests;

public class SupportTicketNotificationTargetTests
{
    [Fact]
    public void ForCustomer_ReturnsCustomerTicketDetailPath()
    {
        SupportTicketNotificationTarget.ForCustomer(42)
            .Should().Be("/customer/support-tickets/42");
    }

    [Fact]
    public void ForStaff_ReturnsStaffTicketDetailPath()
    {
        SupportTicketNotificationTarget.ForStaff(42)
            .Should().Be("/support-tickets/42");
    }
}
