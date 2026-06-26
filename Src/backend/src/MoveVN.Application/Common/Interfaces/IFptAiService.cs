namespace MoveVN.Application.Common.Interfaces;

public interface IFptAiService
{
    Task<FptAiResult> VerifyNationalIdAsync(Stream frontImage, string frontFileName, Stream? backImage, string? backFileName, CancellationToken cancellationToken = default);
}

public class FptAiResult
{
    public bool Success { get; init; }
    public string? NationalId { get; init; }
    public string? FullName { get; init; }
    public DateOnly? DateOfBirth { get; init; }
    public string? Sex { get; init; }
    public string? Address { get; init; }
    public string? HomeAddress { get; init; }
    public DateOnly? IssueDate { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public string? CardType { get; init; }
    public decimal Confidence { get; init; }
    public string? RawResponse { get; init; }
    public string? ErrorMessage { get; init; }
    public bool IsBlurry { get; init; }
    public bool IsLowConfidence { get; init; }
}
