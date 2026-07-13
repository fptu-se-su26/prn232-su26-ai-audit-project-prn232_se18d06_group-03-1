namespace MoveVN.Application.Modules.Bookings.DTOs;

public class CreateInspectionReportRequest
{
    public int? OdometerKm { get; set; }
    public string? FuelLevel { get; set; }
    public bool DamageNoted { get; set; }
    public string? DamageDescription { get; set; }
    public IReadOnlyCollection<InspectionImageUpload> Images { get; set; } = [];
}

public class InspectionImageUpload
{
    public Stream Content { get; set; } = Stream.Null;
    public string FileName { get; set; } = string.Empty;
}

public class InspectionReportResponse
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public string Type { get; set; } = string.Empty;
    public long CreatedByUserId { get; set; }
    public int? OdometerKm { get; set; }
    public string? FuelLevel { get; set; }
    public bool DamageNoted { get; set; }
    public string? DamageDescription { get; set; }
    public string? ReportPdfUrl { get; set; }
    public string? CustomerSignatureUrl { get; set; }
    public bool IsCustomerConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CheckInOutImageResponse> Images { get; set; } = new();
}

public class CheckInOutImageResponse
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long? InspectionId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ImageType { get; set; } = string.Empty;
    public long UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
