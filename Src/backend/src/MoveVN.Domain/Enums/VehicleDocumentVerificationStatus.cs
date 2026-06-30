namespace MoveVN.Domain.Enums;

public enum VehicleDocumentVerificationStatus
{
    Pending = 0,
    Verified = 1,
    NeedMoreInfo = 2,
    ManualReview = 3,
    Rejected = 4,
    Failed = 5
}
