namespace MoveVN.Domain.Entities;

public class Dispute
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long? ReportId { get; set; }
    public long OpenedBy { get; set; }
    public long? AssignedStaffId { get; set; }
    public string Status { get; set; } = "Open";
    public string? Resolution { get; set; }
    public string CompensationDirection { get; set; } = "NoCompensation";
    public string SettlementMethod { get; set; } = "DepositThenExternal";
    public decimal? CompensationAmount { get; set; }
    public decimal? AdminApprovedAmount { get; set; }
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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

