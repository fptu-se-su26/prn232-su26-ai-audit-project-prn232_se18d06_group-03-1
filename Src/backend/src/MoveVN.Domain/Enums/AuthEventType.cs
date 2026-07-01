namespace MoveVN.Domain.Enums;

public enum AuthEventType
{
    RegisterRequested = 1,
    OtpVerified = 2,
    OtpFailed = 3,
    LoginSucceeded = 4,
    LoginFailed = 5,
    RefreshTokenIssued = 6,
    Logout = 7,
    PasswordResetRequested = 8,
    PasswordResetCompleted = 9,
    PasswordChanged = 10,
    StaffCreated = 11,
    PasswordForceReset = 12,
    GoogleLogin = 13,
    OwnerApplicationCreated = 14,
    OwnerApplicationBankUpdated = 15,
    OwnerApplicationSubmitted = 16,
    OwnerRoleAssigned = 17,
    NationalIdSubmitted = 18,
    NationalIdVerified = 19,
    NationalIdNeedMoreInfo = 20,
    NationalIdRejected = 21,
    OwnerApplicationApproved = 22,
    OwnerApplicationRejected = 23,
    OwnerApplicationMoreInfoRequested = 24
}
