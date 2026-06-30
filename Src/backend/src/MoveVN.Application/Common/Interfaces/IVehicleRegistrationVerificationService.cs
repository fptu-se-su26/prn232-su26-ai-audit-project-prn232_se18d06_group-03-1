namespace MoveVN.Application.Common.Interfaces;

public interface IVehicleRegistrationVerificationService
{
    Task<VehicleRegistrationVerificationResult> VerifyAsync(
        VehicleRegistrationVerificationRequest request,
        CancellationToken cancellationToken = default);
}

public class VehicleRegistrationVerificationRequest
{
    public string ExpectedVehicleType { get; set; } = string.Empty;
    public string? ExpectedLicensePlate { get; set; }
    public string? ExpectedBrand { get; set; }
    public string? ExpectedModel { get; set; }
    public string FileUrl { get; set; } = string.Empty;
}

public class VehicleRegistrationVerificationResult
{
    public bool Valid { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string RegistrationVehicleType { get; set; } = string.Empty;
    public bool VehicleTypeMatchesExpected { get; set; }
    public bool? LicensePlateMatchesExpected { get; set; }
    public bool? BrandMatchesExpected { get; set; }
    public bool? ModelMatchesExpected { get; set; }
    public decimal OcrConfidence { get; set; }
    public VehicleRegistrationExtractedResult Extracted { get; set; } = new();
    public List<string> Flags { get; set; } = [];
    public string Recommendation { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string RawResponse { get; set; } = string.Empty;
}

public class VehicleRegistrationExtractedResult
{
    public string? LicensePlate { get; set; }
    public string? OwnerName { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? EngineNumber { get; set; }
    public string? ChassisNumber { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public List<string> RawText { get; set; } = [];
}
