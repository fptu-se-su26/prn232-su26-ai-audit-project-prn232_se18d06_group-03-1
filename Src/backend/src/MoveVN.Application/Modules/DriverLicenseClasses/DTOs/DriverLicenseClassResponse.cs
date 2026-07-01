namespace MoveVN.Application.Modules.DriverLicenseClasses.DTOs;

public class DriverLicenseClassResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SystemVersion { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
