using MoveVN.Application.Common.Models;
using MoveVN.Application.Modules.Vehicles.DTOs;

namespace MoveVN.Application.Modules.Admin.DTOs;

public sealed class CreateAdminVehicleRequest
{
    public long OwnerId { get; set; }
    public int BrandId { get; set; }
    public int ModelId { get; set; }
    public int? VariantId { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public int? OdometerKm { get; set; }
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public int? AreaId { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal PricePerDay { get; set; }
    public int DepositPercent { get; set; }
    public string? PricingMode { get; set; }
    public decimal? FixedPricePerDay { get; set; }
    public decimal? AutoMinPrice { get; set; }
    public decimal? AutoMaxPrice { get; set; }
    public List<int> FeatureIds { get; set; } = [];
    public List<string> ImageUrls { get; set; } = [];
    public int? FeaturedImageIndex { get; set; }
    public string? DocumentFileUrl { get; set; }
}

public sealed class AdminVehicleOcrPreviewRequest
{
    public AdminDocumentFile? CavetImage { get; set; }
    public string? ExpectedLicensePlate { get; set; }
    public string? ExpectedBrand { get; set; }
    public string? ExpectedModel { get; set; }
    public string VehicleType { get; set; } = string.Empty;
}

public sealed class AdminVehicleOcrPreviewResponse
{
    public bool Success { get; set; }
    public string? LicensePlate { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? EngineNumber { get; set; }
    public string? ChassisNumber { get; set; }
    public decimal? Confidence { get; set; }
    public string? Recommendation { get; set; }
    public List<string> Flags { get; set; } = [];
    public string? Message { get; set; }
}

public sealed class AdminPostStatsResponse
{
    public int TotalVehicles { get; set; }
    public int PendingListings { get; set; }
    public int ApprovedListings { get; set; }
    public int RejectedListings { get; set; }
    public int TotalOwners { get; set; }
    public List<VehicleModerationChartPoint> VehicleTypeChart { get; set; } = [];
    public List<MonthlyPostCount> MonthlyPostStats { get; set; } = [];
    public List<AdminPostRecentItem> RecentPosts { get; set; } = [];
}

public sealed class MonthlyPostCount
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
}

public sealed class AdminPostRecentItem
{
    public long Id { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public sealed class AdminOwnerListItem
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; }
    public int TotalVehicles { get; set; }
    public int CarCount { get; set; }
    public int MotorbikeCount { get; set; }
}

public sealed class AdminOwnerVehicleListItem
{
    public long Id { get; set; }
    public string OwnerFullName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? FeaturedImage { get; set; }
    public DateTime CreatedAt { get; set; }
}
