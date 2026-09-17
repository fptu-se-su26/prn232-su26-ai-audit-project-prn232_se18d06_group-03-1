namespace MoveVN.Application.Modules.UserSecurity.DTOs;

public class PinStatusResponse
{
    public bool IsPinSet { get; set; }
    public int FailedPinAttempts { get; set; }
    public DateTime? PinLockoutEnd { get; set; }
    public long? LockoutRemainingSeconds { get; set; }
}

public class SetupPinRequest
{
    public string PinCode { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
}

public class ChangePinRequest
{
    public string CurrentPinCode { get; set; } = string.Empty;
    public string NewPinCode { get; set; } = string.Empty;
}

public class VerifyPinViewDocumentRequest
{
    public string PinCode { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
}

public class ViewDocumentPlaintextResponse
{
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? LicenseClass { get; set; }
    public string? VehicleType { get; set; }
    public DateTime? VerifiedAt { get; set; }
}

public class ForgotPinRequestOtpRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ForgotPinResetRequest
{
    public string Email { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string NewPinCode { get; set; } = string.Empty;
}