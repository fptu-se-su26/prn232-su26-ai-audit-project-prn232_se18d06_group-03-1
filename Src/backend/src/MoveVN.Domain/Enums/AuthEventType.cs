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
    GoogleLogin = 13
}
