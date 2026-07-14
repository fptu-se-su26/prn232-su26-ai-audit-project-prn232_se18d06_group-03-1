namespace MoveVN.Application.Modules.Disputes.Services;

public static class DisputeWorkflowRules
{
    public static bool HaveAllRequestedPartiesResponded(string? requestedFrom, IEnumerable<string> respondedRoles)
    {
        var roles = respondedRoles.ToHashSet(StringComparer.OrdinalIgnoreCase);
        return requestedFrom switch
        {
            "Both" => roles.Contains("Customer") && roles.Contains("Owner"),
            "Customer" => roles.Contains("Customer"),
            "Owner" => roles.Contains("Owner"),
            _ => false
        };
    }

    public static bool IsDamageDisputeWindowOpen(DateTime checkOutCreatedAt, DateTime? customerConfirmedAt, DateTime now)
        => now <= (customerConfirmedAt ?? checkOutCreatedAt).AddHours(48);
}
