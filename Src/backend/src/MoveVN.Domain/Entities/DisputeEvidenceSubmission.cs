namespace MoveVN.Domain.Entities;

public class DisputeEvidenceSubmission
{
    public long Id { get; set; }
    public long DisputeId { get; set; }
    public long SubmittedBy { get; set; }
    public string SubmittedRole { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
