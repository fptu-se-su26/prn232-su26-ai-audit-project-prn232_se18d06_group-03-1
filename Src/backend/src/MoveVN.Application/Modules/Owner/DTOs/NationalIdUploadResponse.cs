namespace MoveVN.Application.Modules.Owner.DTOs;

public class NationalIdUploadResponse
{
    public string Status { get; set; } = string.Empty;
    public bool NationalIdVerified { get; set; }
    public string OwnerApplicationStatus { get; set; } = string.Empty;
    public string NextStep { get; set; } = string.Empty;
    public string? Message { get; set; }
}
