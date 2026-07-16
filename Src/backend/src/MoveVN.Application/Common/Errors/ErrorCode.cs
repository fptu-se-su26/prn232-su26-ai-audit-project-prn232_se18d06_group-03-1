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

    public static readonly ErrorCode SUCCESS = new("200", "Thành công.", HttpStatusCode.OK);
    public static readonly ErrorCode VALIDATION_ERROR = new("422", "Dữ liệu không hợp lệ.", HttpStatusCode.UnprocessableEntity);
    public static readonly ErrorCode INTERNAL_SERVER_ERROR = new("500", "Lỗi hệ thống.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode UNAUTHORIZED = new("401", "Chưa đăng nhập.", HttpStatusCode.Unauthorized);
    public static readonly ErrorCode FORBIDDEN = new("403", "Không có quyền truy cập.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode NOT_FOUND = new("404", "Không tìm thấy tài nguyên.", HttpStatusCode.NotFound);

    public static readonly ErrorCode EMAIL_EXISTED = new("AUTH_1001", "Email đã tồn tại.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode INVALID_CREDENTIALS = new("AUTH_1002", "Email hoặc mật khẩu không đúng.", HttpStatusCode.Unauthorized);
    public static readonly ErrorCode EMAIL_NOT_VERIFIED = new("AUTH_1003", "Email chưa được xác thực.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode USER_NOT_FOUND = new("AUTH_1004", "Không tìm thấy người dùng.", HttpStatusCode.NotFound);
    public static readonly ErrorCode USER_SUSPENDED = new("AUTH_1005", "Tài khoản đã bị khoá.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode USER_DELETED = new("AUTH_1008", "Tài khoản đã bị xóa.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode INVALID_ROLE = new("AUTH_1006", "Vai trò không hợp lệ.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PHONE_EXISTED = new("AUTH_1007", "Số điện thoại đã tồn tại.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OTP_RATE_LIMITED = new("AUTH_1010", "Quá nhiều yêu cầu OTP. Vui lòng thử lại sau.", HttpStatusCode.TooManyRequests);
    public static readonly ErrorCode OTP_FAIL = new("AUTH_1011", "OTP không hợp lệ hoặc đã hết hạn.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OTP_ALREADY_USED = new("AUTH_1012", "OTP đã được sử dụng.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode EMAIL_SEND_FAILED = new("AUTH_1013", "Gửi email OTP thất bại.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode REFRESH_TOKEN_INVALID = new("AUTH_1020", "Refresh token không hợp lệ.", HttpStatusCode.Unauthorized);
    public static readonly ErrorCode REFRESH_TOKEN_EXPIRED = new("AUTH_1021", "Refresh token đã hết hạn.", HttpStatusCode.Unauthorized);
    public static readonly ErrorCode PASSWORD_CONFIRM_MISMATCH = new("AUTH_1030", "Xác nhận mật khẩu không khớp.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PASSWORD_INCORRECT = new("AUTH_1031", "Mật khẩu hiện tại không đúng.", HttpStatusCode.BadRequest);

    public static readonly ErrorCode STAFF_CREATE_FORBIDDEN = new("ADMIN_2001", "Chỉ admin mới có thể tạo tài khoản nhân viên.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode STAFF_EMAIL_EXISTED = new("ADMIN_2002", "Email nhân viên đã tồn tại.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode ADMIN_SEED_FAILED = new("ADMIN_2003", "Khởi tạo tài khoản admin thất bại.", HttpStatusCode.InternalServerError);

    public static readonly ErrorCode GOOGLE_AUTH_FAILED = new("AUTH_1040", "Xác thực Google thất bại.", HttpStatusCode.Unauthorized);

    public static readonly ErrorCode CLOUDINARY_UPLOAD_FAILED = new("CLOUD_3001", "Tải ảnh lên Cloudinary thất bại.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode CLOUDINARY_DELETE_FAILED = new("CLOUD_3002", "Xoá ảnh trên Cloudinary thất bại.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode CLOUDINARY_SIGNED_URL_FAILED = new("CLOUD_3003", "Tạo URL ký thất bại.", HttpStatusCode.InternalServerError);

    public static readonly ErrorCode FPT_AI_VERIFICATION_FAILED = new("FPT_4001", "Xác thực FPT.AI thất bại.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode FPT_AI_TIMEOUT = new("FPT_4002", "Yêu cầu FPT.AI đã hết thời gian chờ.", HttpStatusCode.GatewayTimeout);
    public static readonly ErrorCode FPT_AI_INVALID_RESPONSE = new("FPT_4003", "FPT.AI trả về phản hồi không hợp lệ.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode FPT_AI_LOW_QUALITY = new("FPT_4004", "Chất lượng ảnh quá thấp cho FPT.AI.", HttpStatusCode.BadRequest);

    public static readonly ErrorCode REDIS_LOCK_FAILED = new("REDIS_5001", "Không thể lấy khoá phân tán.", HttpStatusCode.InternalServerError);

    public static readonly ErrorCode OWNER_ALREADY_OWNER = new("OWNER_6001", "Người dùng đã là chủ xe.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_APPLICATION_ACTIVE = new("OWNER_6002", "Người dùng đã có đơn đăng ký chủ xe đang hoạt động.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_APPLICATION_NOT_FOUND = new("OWNER_6003", "Không tìm thấy đơn đăng ký chủ xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode OWNER_ALREADY_HAS_ROLE = new("OWNER_6004", "Người dùng đã có vai trò chủ xe.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_CCCD_NOT_VERIFIED = new("OWNER_6005", "CCCD phải được xác thực trước khi gửi.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_BANK_INFO_MISSING = new("OWNER_6006", "Thông tin ngân hàng chưa đầy đủ.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_NOT_READY_TO_SUBMIT = new("OWNER_6007", "Đơn đăng ký chưa sẵn sàng để gửi.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_EMAIL_NOT_VERIFIED = new("OWNER_6008", "Email phải được xác thực trước khi tạo đơn chủ xe.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_USER_NOT_ACTIVE = new("OWNER_6009", "Tài khoản phải ở trạng thái hoạt động.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_FILE_INVALID = new("OWNER_6010", "Tệp không hợp lệ. Chỉ chấp nhận ảnh JPG/PNG/WebP dưới 5MB.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_NATIONAL_ID_ALREADY_VERIFIED = new("OWNER_6011", "CCCD đã được xác thực.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode OWNER_VERIFICATION_REQUEST_FAILED = new("OWNER_6012", "Xử lý yêu cầu xác thực thất bại.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode OWNER_VERIFICATION_PROCESSING = new("OWNER_6013", "Yêu cầu xác thực CCCD đang được xử lý. Vui lòng đợi.", HttpStatusCode.Conflict);
    public static readonly ErrorCode OWNER_NATIONAL_ID_VERIFICATION_NOT_FOUND = new("OWNER_6014", "Không tìm thấy yêu cầu xác thực CCCD.", HttpStatusCode.NotFound);
    public static readonly ErrorCode OWNER_NATIONAL_ID_REVIEW_INVALID_STATE = new("OWNER_6015", "Yêu cầu xác thực CCCD không ở trạng thái chờ duyệt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode STAFF_APPLICATION_NOT_FOUND = new("STAFF_7001", "Không tìm thấy đơn đăng ký chủ xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode STAFF_APPROVE_INVALID_STATE = new("STAFF_7002", "Đơn phải ở trạng thái ReadyToSubmit hoặc ManualReview để duyệt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode STAFF_REJECT_INVALID_STATE = new("STAFF_7003", "Đơn đã được duyệt hoặc từ chối.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode STAFF_REQUEST_MORE_INFO_INVALID_STATE = new("STAFF_7004", "Đơn đã được duyệt hoặc từ chối.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode STAFF_REASON_REQUIRED = new("STAFF_7005", "Vui lòng nhập lý do.", HttpStatusCode.BadRequest);

    public static readonly ErrorCode VEHICLE_BRAND_NOT_FOUND = new("BRAND_8001", "Không tìm thấy hãng xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_BRAND_INACTIVE = new("BRAND_8002", "Không thể kích hoạt dòng xe vì hãng xe đang tắt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode VEHICLE_MODEL_NOT_FOUND = new("MODEL_8101", "Không tìm thấy dòng xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_MODEL_INACTIVE = new("MODEL_8102", "Không thể kích hoạt phiên bản vì dòng xe đang tắt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode VEHICLE_MODEL_VARIANT_NOT_FOUND = new("VARIANT_8201", "Không tìm thấy phiên bản xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode DRIVER_LICENSE_CLASS_NOT_FOUND = new("LICENSE_8301", "Không tìm thấy hạng bằng lái.", HttpStatusCode.NotFound);
    public static readonly ErrorCode DRIVER_LICENSE_FILE_INVALID = new("LICENSE_8302", "Ảnh bằng lái không hợp lệ. Chỉ chấp nhận JPG/PNG/WebP dưới 5MB.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode DRIVER_LICENSE_VERIFICATION_FAILED = new("LICENSE_8303", "Xác thực bằng lái thất bại.", HttpStatusCode.InternalServerError);
    public static readonly ErrorCode DRIVER_LICENSE_VERIFICATION_PENDING = new("LICENSE_8304", "Đã có yêu cầu xác thực bằng lái đang chờ duyệt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode DRIVER_LICENSE_UPDATE_TOO_SOON = new("LICENSE_8305", "Chỉ có thể cập nhật bằng lái sau thời gian chờ.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode DRIVER_LICENSE_VERIFICATION_NOT_FOUND = new("LICENSE_8306", "Không tìm thấy yêu cầu xác thực bằng lái.", HttpStatusCode.NotFound);
    public static readonly ErrorCode DRIVER_LICENSE_REVIEW_INVALID_STATE = new("LICENSE_8307", "Yêu cầu xác thực bằng lái không ở trạng thái chờ duyệt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode DRIVER_LICENSE_UPLOAD_LOCKED = new("LICENSE_8308", "Tải lên bằng lái tạm thời bị khoá.", HttpStatusCode.TooManyRequests);
    public static readonly ErrorCode DRIVER_LICENSE_MANUAL_OVERRIDE_NOT_ALLOWED = new("LICENSE_8309", "Chỉ có thể nhập tay bằng lái khi OCR không đọc được.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode DRIVER_LICENSE_MANUAL_FIELDS_REQUIRED = new("LICENSE_8310", "Số bằng và hạng bằng là bắt buộc khi duyệt OCR không đọc được.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode DRIVER_LICENSE_VEHICLE_TYPE_INVALID = new("LICENSE_8311", "Loại xe yêu cầu trên bằng lái không hợp lệ.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode VEHICLE_FEATURE_NOT_FOUND = new("FEATURE_8401", "Không tìm thấy tính năng xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode PRICING_REGION_NOT_FOUND = new("PRICE_8501", "Không tìm thấy vùng giá.", HttpStatusCode.NotFound);
    public static readonly ErrorCode AREA_NOT_FOUND = new("PRICE_8502", "Không tìm thấy khu vực.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_MODEL_PRICING_NOT_FOUND = new("PRICE_8503", "Không tìm thấy giá dòng xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_PRICING_NOT_FOUND = new("PRICE_8504", "Không tìm thấy giá xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode PRICING_RULE_NOT_FOUND = new("PRICE_8505", "Không tìm thấy quy tắc giá.", HttpStatusCode.NotFound);
    public static readonly ErrorCode PRICING_MODE_INVALID = new("PRICE_8506", "Chế độ giá không hợp lệ.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PRICING_INVALID_RANGE = new("PRICE_8507", "Khoảng giá không hợp lệ.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PRICING_OUT_OF_SUGGESTED_RANGE = new("PRICE_8508", "Giá nằm ngoài khoảng đề xuất.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PRICING_DUPLICATED = new("PRICE_8509", "Dữ liệu giá đã tồn tại.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PRICING_RULE_INVALID = new("PRICE_8510", "Quy tắc giá không hợp lệ.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode PLATFORM_FEE_RULE_NOT_FOUND = new("PRICE_8511", "Không tìm thấy quy tắc phí nền tảng.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_NOT_FOUND = new("VEHICLE_9001", "Không tìm thấy xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_TOGGLE_INVALID = new("VEHICLE_9002", "Chỉ có thể chuyển đổi giữa trạng thái Đã duyệt và Ẩn.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode VEHICLE_DOCUMENT_NOT_FOUND = new("VEHICLE_9003", "Không tìm thấy giấy tờ xe.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_DOCUMENT_NOT_VERIFIED = new("VEHICLE_9004", "Giấy tờ xe phải được xác thực trước khi duyệt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode BLOCKED_DATE_OVERLAP_BOOKING = new("VEHICLE_9005", "Khoảng thời gian đã chọn trùng với lịch đặt xe hiện có.", HttpStatusCode.Conflict);
    public static readonly ErrorCode BLOCKED_DATE_INVALID_RANGE = new("VEHICLE_9006", "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode BLOCKED_DATE_NOT_FOUND = new("VEHICLE_9007", "Không tìm thấy ngày chặn.", HttpStatusCode.NotFound);
    public static readonly ErrorCode VEHICLE_DOCUMENT_VERIFICATION_PENDING = new("VEHICLE_9008", "Đã có yêu cầu xác thực giấy tờ xe đang chờ duyệt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode VEHICLE_DOCUMENT_UPLOAD_LOCKED = new("VEHICLE_9009", "Tải lên giấy tờ xe tạm thời bị khoá.", HttpStatusCode.TooManyRequests);
    public static readonly ErrorCode VEHICLE_DELETE_ACTIVE_BOOKINGS = new("VEHICLE_9010", "Không thể xóa xe đang có lịch đặt.", HttpStatusCode.Conflict);
    public static readonly ErrorCode VEHICLE_DELETE_APPROVED = new("VEHICLE_9011", "Hãy ẩn xe trước khi xóa.", HttpStatusCode.BadRequest);

    public static readonly ErrorCode BOOKING_NOT_FOUND = new("BOOK_10001", "Không tìm thấy booking.", HttpStatusCode.NotFound);
    public static readonly ErrorCode BOOKING_DATES_INVALID = new("BOOK_10002", "Ngày trả phải sau ngày nhận.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode BOOKING_OVERLAP = new("BOOK_10003", "Xe đã được đặt trong khoảng thời gian này.", HttpStatusCode.Conflict);
    public static readonly ErrorCode BOOKING_VEHICLE_NOT_AVAILABLE = new("BOOK_10004", "Xe không có sẵn để đặt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode BOOKING_NOT_PENDING = new("BOOK_10005", "Booking không ở trạng thái chờ duyệt.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode BOOKING_NOT_OWNER = new("BOOK_10006", "Bạn không có quyền xử lý booking này.", HttpStatusCode.Forbidden);
    public static readonly ErrorCode BOOKING_REJECT_REASON_REQUIRED = new("BOOK_10007", "Vui lòng nhập lý do từ chối.", HttpStatusCode.BadRequest);
    public static readonly ErrorCode NOTIFICATION_NOT_FOUND = new("NOTIFICATION_10001", "Không tìm thấy thông báo.", HttpStatusCode.NotFound);

    public override string ToString() => $"{Code}: {Message}";
}
