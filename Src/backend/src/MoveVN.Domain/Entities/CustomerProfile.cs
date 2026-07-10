namespace MoveVN.Domain.Entities;

public class CustomerProfile
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? NationalId { get; set; }
    public string? NationalIdHash { get; set; }
    public string? NationalIdMasked { get; set; }
    public bool NationalIdVerified { get; set; }
    public string? DriverLicenseNumber { get; set; }
    public string? DriverLicenseClass { get; set; }
    public bool DriverLicenseVerified { get; set; }
    public DateTime? DriverLicenseVerifiedAt { get; set; }
    public long? DriverLicenseVerificationRequestId { get; set; }
    public string? DriverLicenseVerifiedVehicleTypes { get; set; }
    public string? PreferredVehicleType { get; set; }
}

