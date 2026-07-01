namespace MoveVN.Domain.Entities;

public class DriverLicenseClassCompatibility
{
    public int LicenseClassId { get; set; }
    public int AllowedRequiredLicenseClassId { get; set; }
}
