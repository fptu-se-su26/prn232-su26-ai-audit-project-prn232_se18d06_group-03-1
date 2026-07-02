namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class VehicleResponse
{
    public long Id { get; set; }
    public long OwnerId { get; set; }
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int? VariantId { get; set; }
    public string? VariantName { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public int? OdometerKm { get; set; }
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public int? AreaId { get; set; }
    public string? AreaName { get; set; }
    public int? PricingRegionId { get; set; }
    public string? PricingRegionCode { get; set; }
    public decimal PricePerDay { get; set; }
    public bool RequiresDeposit { get; set; }
    public decimal? DepositAmount { get; set; }
    public string? PricingMode { get; set; }
    public decimal? FixedPricePerDay { get; set; }
    public decimal? AutoMinPrice { get; set; }
    public decimal? AutoMaxPrice { get; set; }
    public decimal? CurrentPricePerDay { get; set; }
    public decimal? SuggestedBasePrice { get; set; }
    public decimal? SuggestedMinPrice { get; set; }
    public decimal? SuggestedMaxPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public string? FeaturedImage { get; set; }
    public List<VehicleImageResponse> Images { get; set; } = [];
    public List<VehicleFeatureResponse> Features { get; set; } = [];
    public List<VehicleDocumentResponse> Documents { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class VehicleImageResponse
{
    public long Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public byte SortOrder { get; set; }
}

public class VehicleFeatureResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class VehicleDocumentResponse
{
    public long Id { get; set; }
    public string DocType { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public DateOnly? ExpiryDate { get; set; }
    public bool Verified { get; set; }
    public bool IsCurrent { get; set; }
    public string VerificationStatus { get; set; } = string.Empty;
    public string? VerificationProvider { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? DecisionReason { get; set; }
    public string? OcrLicensePlate { get; set; }
    public string? OcrBrand { get; set; }
    public string? OcrModel { get; set; }
    public string? OcrEngineNumber { get; set; }
    public string? OcrChassisNumber { get; set; }
    public decimal? OcrConfidence { get; set; }
    public DateTime? CreatedAt { get; set; }
}
