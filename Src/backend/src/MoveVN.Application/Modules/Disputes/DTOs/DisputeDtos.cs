namespace MoveVN.Application.Modules.Disputes.DTOs;

public class DisputeListRequest
{
    public string? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CreateDisputeRequest
{
    public long BookingId { get; set; }
    public string ReportType { get; set; } = "Dispute";
    public string Description { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; }
}

public class ResolveDisputeRequest
{
    public string Resolution { get; set; } = string.Empty;
    public decimal? CompensationAmount { get; set; }
}

public class DisputeListItem
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public long OpenedBy { get; set; }
    public string OpenedByName { get; set; } = string.Empty;
    public long CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public long OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public long? AssignedStaffId { get; set; }
    public string? AssignedStaffName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ReportType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; }
    public string? Resolution { get; set; }
    public decimal? CompensationAmount { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DisputeDetailResponse : DisputeListItem
{
    public List<DisputeAuditLogItem> AuditLogs { get; set; } = [];
}

public class DisputeAuditLogItem
{
    public long Id { get; set; }
    public long? ActorId { get; set; }
    public string? ActorRole { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; }
}
