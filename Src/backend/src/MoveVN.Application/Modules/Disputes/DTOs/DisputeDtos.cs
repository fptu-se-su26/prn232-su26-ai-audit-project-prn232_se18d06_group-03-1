using MoveVN.Application.Modules.Bookings.DTOs;

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
    public string CompensationDirection { get; set; } = "NoCompensation";
    public string SettlementMethod { get; set; } = "DepositThenExternal";
    public decimal? CompensationAmount { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class RequestMoreEvidenceRequest
{
    public string RequestedFrom { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
}

public class AddDisputeEvidenceRequest
{
    public string? EvidenceUrls { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
}

public class ConfirmExternalSettlementRequest
{
    public DateTime? UpdatedAt { get; set; }
}

public class AdminCloseDisputeRequest
{
    public string Reason { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
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
    public string CompensationDirection { get; set; } = string.Empty;
    public string SettlementMethod { get; set; } = string.Empty;
    public decimal? CompensationAmount { get; set; }
    public decimal? AdminApprovedAmount { get; set; }
    public decimal? FinalCompensationAmount { get; set; }
    public decimal PlatformSettledAmount { get; set; }
    public DateTime? PlatformSettlementCompletedAt { get; set; }
    public decimal ExternalSettlementAmount { get; set; }
    public bool CustomerExternalConfirmed { get; set; }
    public DateTime? CustomerExternalConfirmedAt { get; set; }
    public bool OwnerExternalConfirmed { get; set; }
    public DateTime? OwnerExternalConfirmedAt { get; set; }
    public long? DecidedBy { get; set; }
    public DateTime? DecisionIssuedAt { get; set; }
    public long? ClosedBy { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? AdminCloseReason { get; set; }
    public long? EscalatedBy { get; set; }
    public DateTime? EscalatedAt { get; set; }
    public string? EvidenceRequestedFrom { get; set; }
    public string? EvidenceRequestMessage { get; set; }
    public DateTime? EvidenceRequestedAt { get; set; }
    public DateTime? EvidenceRespondedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DisputeDetailResponse : DisputeListItem
{
    public List<DisputeAuditLogItem> AuditLogs { get; set; } = [];
    public List<InspectionReportResponse> InspectionReports { get; set; } = [];
    public List<DisputeEvidenceSubmissionItem> EvidenceSubmissions { get; set; } = [];
}

public class DisputeEvidenceSubmissionItem
{
    public long Id { get; set; }
    public long SubmittedBy { get; set; }
    public string SubmittedByName { get; set; } = string.Empty;
    public string SubmittedRole { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; }
    public DateTime CreatedAt { get; set; }
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
