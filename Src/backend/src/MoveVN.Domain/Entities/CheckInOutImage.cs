namespace MoveVN.Domain.Entities;

public class CheckInOutImage
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public long? InspectionId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ImageType { get; set; } = string.Empty;
    public long UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

