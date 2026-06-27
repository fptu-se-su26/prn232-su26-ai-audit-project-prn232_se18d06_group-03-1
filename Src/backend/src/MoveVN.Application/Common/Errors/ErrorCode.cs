using System.Net;

namespace MoveVN.Application.Common.Errors;

public sealed class ErrorCode
{
    public string Code { get; }
    public string Message { get; }
    public HttpStatusCode HttpCode { get; }

    private ErrorCode(string code, string message, HttpStatusCode httpCode)
    {
        Code = code;
        Message = message;
        HttpCode = httpCode;
    }

    public static readonly ErrorCode SUCCESS = new("200", "Success.", HttpStatusCode.OK);
    public static readonly ErrorCode VALIDATION_ERROR = new("422", "Validation failed.", HttpStatusCode.UnprocessableEntity);
    public static readonly ErrorCode INTERNAL_SERVER_ERROR = new("500", "Internal server error.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode UNAUTHORIZED = new("401", "Unauthorized.", HttpStatusCode.Unauthorized);
    public static readonly ErrorCode FORBIDDEN = new("403", "Forbidden.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode NOT_FOUND = new("404", "Resource was not found.", HttpStatusCode.NotFound);

    public static readonly ErrorCode EMAIL_EXISTED = new("AUTH_1001", "Email already exists.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode INVALID_CREDENTIALS = new("AUTH_1002", "Email or password is incorrect.", HttpStatusCode.Unauthorized);
    public static readonly ErrorCode EMAIL_NOT_VERIFIED = new("AUTH_1003", "Email has not been verified.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode USER_NOT_FOUND = new("AUTH_1004", "User was not found.", HttpStatusCode.NotFound);
    public static readonly ErrorCode USER_SUSPENDED = new("AUTH_1005", "User account is suspended.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode INVALID_ROLE = new("AUTH_1006", "Role is invalid.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PHONE_EXISTED = new("AUTH_1007", "Phone number already exists.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OTP_RATE_LIMITED = new("AUTH_1010", "Too many OTP requests. Please try again later.", HttpStatusCode.TooManyRequests);
    public static readonly ErrorCode OTP_FAIL = new("AUTH_1011", "OTP is invalid or expired.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OTP_ALREADY_USED = new("AUTH_1012", "OTP has already been used.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode EMAIL_SEND_FAILED = new("AUTH_1013", "Failed to send OTP email.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode REFRESH_TOKEN_INVALID = new("AUTH_1020", "Refresh token is invalid.", HttpStatusCode.Unauthorized);
    public static readonly ErrorCode REFRESH_TOKEN_EXPIRED = new("AUTH_1021", "Refresh token has expired.", HttpStatusCode.Unauthorized);
    public static readonly ErrorCode PASSWORD_CONFIRM_MISMATCH = new("AUTH_1030", "Password confirmation does not match.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PASSWORD_INCORRECT = new("AUTH_1031", "Current password is incorrect.", HttpStatusCode.BadRequest);

    public static readonly ErrorCode STAFF_CREATE_FORBIDDEN = new("ADMIN_2001", "Only admin can create staff accounts.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode STAFF_EMAIL_EXISTED = new("ADMIN_2002", "Staff email already exists.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode ADMIN_SEED_FAILED = new("ADMIN_2003", "Failed to seed admin account.", HttpStatusCode.InternalServerError);

    public static readonly ErrorCode GOOGLE_AUTH_FAILED = new("AUTH_1040", "Google authentication failed.", HttpStatusCode.Unauthorized);

    public static readonly ErrorCode CLOUDINARY_UPLOAD_FAILED = new("CLOUD_3001", "Failed to upload image to Cloudinary.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode CLOUDINARY_DELETE_FAILED = new("CLOUD_3002", "Failed to delete image from Cloudinary.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode CLOUDINARY_SIGNED_URL_FAILED = new("CLOUD_3003", "Failed to generate signed URL.", HttpStatusCode.InternalServerError);

    public static readonly ErrorCode FPT_AI_VERIFICATION_FAILED = new("FPT_4001", "FPT.AI verification failed.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode FPT_AI_TIMEOUT = new("FPT_4002", "FPT.AI request timed out.", HttpStatusCode.GatewayTimeout);
    public static readonly ErrorCode FPT_AI_INVALID_RESPONSE = new("FPT_4003", "FPT.AI returned an invalid response.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode FPT_AI_LOW_QUALITY = new("FPT_4004", "Image quality is too low for FPT.AI.", HttpStatusCode.BadRequest);

    public static readonly ErrorCode REDIS_LOCK_FAILED = new("REDIS_5001", "Failed to acquire distributed lock.", HttpStatusCode.InternalServerError);

    public static readonly ErrorCode OWNER_ALREADY_OWNER = new("OWNER_6001", "User is already an owner.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_APPLICATION_ACTIVE = new("OWNER_6002", "User already has an active owner application.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_APPLICATION_NOT_FOUND = new("OWNER_6003", "Owner application not found.", HttpStatusCode.NotFound);
    public static readonly ErrorCode OWNER_ALREADY_HAS_ROLE = new("OWNER_6004", "User already has the Owner role.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_CCCD_NOT_VERIFIED = new("OWNER_6005", "CCCD must be verified before submitting.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_BANK_INFO_MISSING = new("OWNER_6006", "Bank information is incomplete.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_NOT_READY_TO_SUBMIT = new("OWNER_6007", "Owner application is not ready to submit.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_EMAIL_NOT_VERIFIED = new("OWNER_6008", "Email must be verified before creating an owner application.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_USER_NOT_ACTIVE = new("OWNER_6009", "User account must be active.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_FILE_INVALID = new("OWNER_6010", "Invalid file. Only JPG/PNG/WebP images under 5MB are allowed.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_NATIONAL_ID_ALREADY_VERIFIED = new("OWNER_6011", "National ID is already verified.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_VERIFICATION_REQUEST_FAILED = new("OWNER_6012", "Failed to process verification request.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode STAFF_APPLICATION_NOT_FOUND = new("STAFF_7001", "Owner application not found.", HttpStatusCode.NotFound);
    public static readonly ErrorCode STAFF_APPROVE_INVALID_STATE = new("STAFF_7002", "Application must be in ReadyToSubmit or ManualReview status to approve.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode STAFF_REJECT_INVALID_STATE = new("STAFF_7003", "Application is already approved or rejected.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode STAFF_REQUEST_MORE_INFO_INVALID_STATE = new("STAFF_7004", "Application is already approved or rejected.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode STAFF_REASON_REQUIRED = new("STAFF_7005", "Reason is required.", HttpStatusCode.BadRequest);

    public static readonly ErrorCode VEHICLE_BRAND_NOT_FOUND = new("BRAND_8001", "Vehicle brand not found.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_BRAND_INACTIVE = new("BRAND_8002", "Cannot activate model because its brand is inactive.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode VEHICLE_MODEL_NOT_FOUND = new("MODEL_8101", "Vehicle model not found.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_MODEL_INACTIVE = new("MODEL_8102", "Cannot activate variant because its model is inactive.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode VEHICLE_MODEL_VARIANT_NOT_FOUND = new("VARIANT_8201", "Vehicle model variant not found.", HttpStatusCode.NotFound);
    public static readonly ErrorCode DRIVER_LICENSE_CLASS_NOT_FOUND = new("LICENSE_8301", "Driver license class not found.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_FEATURE_NOT_FOUND = new("FEATURE_8401", "Vehicle feature not found.", HttpStatusCode.NotFound);

    public override string ToString() => $"{Code}: {Message}";
}
