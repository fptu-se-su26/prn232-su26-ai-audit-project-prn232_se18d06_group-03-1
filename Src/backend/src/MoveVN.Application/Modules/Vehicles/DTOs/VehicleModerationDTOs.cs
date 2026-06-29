using MoveVN.Application.Common.Models;

namespace MoveVN.Application.Modules.Vehicles.DTOs;

public class VehicleModerationListItem
{
    public long Id { get; set; }
    public long OwnerId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public short Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? DocumentStatus { get; set; }
    public bool DocumentVerified { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class VehicleModerationDetailResponse : VehicleResponse
{
    public List<VehicleVerificationLogResponse> VerificationLogs { get; set; } = [];
}

public class VehicleVerificationLogResponse
{
    public string? Id { get; set; }
    public long VehicleId { get; set; }
    public long VehicleDocumentId { get; set; }
    public string? Recommendation { get; set; }
    public List<string> Flags { get; set; } = [];
    public decimal? OcrConfidence { get; set; }
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class VehicleModerationActionRequest
{
    public string Reason { get; set; } = string.Empty;
}
