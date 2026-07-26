namespace MoveVN.Application.Modules.SupportTickets;

public static class SupportTicketNotificationTarget
{
    public static string ForCustomer(long ticketId)
        => $"/customer/support-tickets/{ticketId}";

    public static string ForStaff(long ticketId)
        => $"/support-tickets/{ticketId}";
}
