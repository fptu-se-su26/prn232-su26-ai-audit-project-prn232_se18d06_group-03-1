namespace MoveVN.Application.Modules.Contracts.DTOs;

public class ContractResponse
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string? PdfUrl { get; set; }
    public DateTime? CustomerSignedAt { get; set; }
    public DateTime? OwnerSignedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
