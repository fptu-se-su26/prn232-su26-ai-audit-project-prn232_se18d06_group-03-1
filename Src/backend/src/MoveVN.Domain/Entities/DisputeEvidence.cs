namespace MoveVN.Domain.Entities;

public class DisputeEvidence
{
    public long Id { get; set; }
    public long DisputeId { get; set; }
    public string EvidenceUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
