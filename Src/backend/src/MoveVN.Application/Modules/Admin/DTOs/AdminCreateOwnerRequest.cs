namespace MoveVN.Application.Modules.Admin.DTOs;

public sealed class AdminCreateOwnerRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;

    public bool UseOcr { get; set; }
    public string NationalId { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public AdminDocumentFile NationalIdFrontImage { get; set; } = new();

    public string DriverLicenseNumber { get; set; } = string.Empty;
    public string DriverLicenseClass { get; set; } = string.Empty;
    public string DriverLicenseVehicleType { get; set; } = string.Empty;
    public AdminDocumentFile DriverLicenseFrontImage { get; set; } = new();

    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolderName { get; set; } = string.Empty;
}

public sealed class AdminDocumentFile
{
    public string FileName { get; set; } = string.Empty;
    public byte[] Content { get; set; } = [];
}

public sealed class AdminOwnerOcrPreviewRequest
{
    public string FullName { get; set; } = string.Empty;
    public AdminDocumentFile? NationalIdFrontImage { get; set; }
    public AdminDocumentFile? DriverLicenseFrontImage { get; set; }
}

public sealed class AdminOwnerOcrPreviewResponse
{
    public AdminNationalIdOcrPreview? NationalId { get; set; }
    public AdminDriverLicenseOcrPreview? DriverLicense { get; set; }
}

public sealed class AdminNationalIdOcrPreview
{
    public bool Success { get; set; }
    public string? NationalId { get; set; }
    public string? FullName { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public decimal? Confidence { get; set; }
    public string? Recommendation { get; set; }
    public List<string> Flags { get; set; } = [];
}

public sealed class AdminDriverLicenseOcrPreview
{
    public bool Success { get; set; }
    public string? FullName { get; set; }
    public string? DriverLicenseNumber { get; set; }
    public string? LicenseClass { get; set; }
    public decimal? Confidence { get; set; }
    public string? Recommendation { get; set; }
    public List<string> Flags { get; set; } = [];
}
