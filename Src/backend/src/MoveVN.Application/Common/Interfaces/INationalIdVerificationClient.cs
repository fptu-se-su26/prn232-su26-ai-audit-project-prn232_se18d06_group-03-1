using System.Text.Json;

namespace MoveVN.Application.Common.Interfaces;

public interface INationalIdVerificationClient
{
    Task<NationalIdPreVerifyResult?> PreVerifyAsync(byte[] imageBytes, string fileName, CancellationToken cancellationToken = default);
}

public class NationalIdPreVerifyResult
{
    public bool Success { get; set; }
    public double Confidence { get; set; }
    public string? NationalId { get; set; }
    public string? FullName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public List<string> Flags { get; set; } = [];
    public string? Recommendation { get; set; }
    public string RawResponse { get; set; } = "{}";
}
