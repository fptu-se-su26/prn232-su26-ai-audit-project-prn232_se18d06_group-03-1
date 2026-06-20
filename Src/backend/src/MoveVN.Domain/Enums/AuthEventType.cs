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
    OwnerApplicationCreated = 12,
    OwnerApplicationBankUpdated = 13,
    OwnerApplicationSubmitted = 14,
    OwnerRoleAssigned = 15,
    NationalIdSubmitted = 16,
    NationalIdVerified = 17,
    NationalIdNeedMoreInfo = 18,
    NationalIdRejected = 19,
    OwnerApplicationApproved = 20,
    OwnerApplicationRejected = 21,
    OwnerApplicationMoreInfoRequested = 22
}
