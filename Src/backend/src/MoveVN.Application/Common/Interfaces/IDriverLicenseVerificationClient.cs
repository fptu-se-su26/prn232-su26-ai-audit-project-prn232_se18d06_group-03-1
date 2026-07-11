namespace MoveVN.Application.Common.Interfaces;

public interface IDriverLicenseVerificationClient
{
    Task<DriverLicenseVerificationResult> VerifyAsync(
        DriverLicenseVerificationFileRequest request,
        CancellationToken cancellationToken = default);
}

public class DriverLicenseVerificationFileRequest
{
    public Stream FileStream { get; set; } = Stream.Null;
    public string FileName { get; set; } = string.Empty;
    public string? FullName { get; set; }
}

public class DriverLicenseVerificationResult
{
    public bool Valid { get; set; }
    public string? DocumentType { get; set; }
    public string? LicenseVehicleType { get; set; }
    public bool LicenseClassValidForExpectedVehicle { get; set; }
    public decimal OcrConfidence { get; set; }
    public DriverLicenseExtractedResult Extracted { get; set; } = new();
    public DriverLicenseNameMatchResult NameMatch { get; set; } = new();
    public List<string> Flags { get; set; } = [];
    public string Recommendation { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string RawResponse { get; set; } = "{}";
}

public class DriverLicenseExtractedResult
{
    public string? FullName { get; set; }
    public string? DriverLicenseNumber { get; set; }
    public string? DateOfBirth { get; set; }
    public string? LicenseClass { get; set; }
    public string? IssueDate { get; set; }
    public string? ExpiryDate { get; set; }
    public string? ExpiryStatus { get; set; }
    public List<string> RawText { get; set; } = [];
}

public class DriverLicenseNameMatchResult
{
    public bool Provided { get; set; }
    public bool? Matched { get; set; }
    public decimal? Score { get; set; }
    public string? SystemFullNameNormalized { get; set; }
    public string? OcrFullNameNormalized { get; set; }
}
