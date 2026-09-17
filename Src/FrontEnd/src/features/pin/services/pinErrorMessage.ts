import { AppApiError } from "@/features/auth/services/authService";

/**
 * Maps backend/system error codes to user-friendly Vietnamese messages.
 * The UI must never show raw backend or English system errors.
 */
const FRIENDLY_MESSAGES: Record<string, string> = {
  PIN_1101: "Bạn chưa thiết lập mã PIN. Vui lòng tạo mã PIN mới để tiếp tục.",
  PIN_1102: "Mã PIN đã được thiết lập trước đó.",
  PIN_1103: "Mã PIN không chính xác.",
  PIN_1105: "Mã PIN phải gồm đúng 6 chữ số.",
  AUTH_1010: "Bạn đã yêu cầu mã OTP quá nhiều lần. Vui lòng thử lại sau.",
  AUTH_1011: "Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại.",
  AUTH_1012: "Mã OTP này đã được sử dụng. Vui lòng gửi mã mới.",
  AUTH_1014: "Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng gửi mã mới.",
  AUTH_1013: "Không gửi được email chứa mã OTP. Vui lòng thử lại sau.",
  "422": "Thông tin nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
  VALIDATION_ERROR: "Thông tin nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
  "429": "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.",
  NETWORK: "Không có kết nối mạng. Vui lòng kiểm tra lại kết nối.",
  "401": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "403": "Bạn không có quyền thực hiện thao tác này.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  "404": "Không tìm thấy dữ liệu yêu cầu.",
  NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
  "500": "Hệ thống đang bận. Vui lòng thử lại sau.",
  INTERNAL_SERVER_ERROR: "Hệ thống đang bận. Vui lòng thử lại sau.",
};

const GENERIC_MESSAGE = "Có lỗi xảy ra. Vui lòng thử lại sau.";

/**
 * Backend messages already safe to show (curated Vietnamese,
 * may contain dynamic info such as remaining lock minutes).
 */
const TRUSTED_BACKEND_MESSAGE_CODES = new Set(["PIN_1104", "PIN_1106"]);

export function getPinErrorCode(error: unknown): string | undefined {
  return error instanceof AppApiError ? error.code : undefined;
}

const OTP_ERROR_CODES = new Set(["AUTH_1011", "AUTH_1012", "AUTH_1014"]);

export function isOtpErrorCode(code: string | undefined): boolean {
  return code !== undefined && OTP_ERROR_CODES.has(code);
}

export function getFriendlyPinMessage(error: unknown): string {
  if (error instanceof AppApiError) {
    if (TRUSTED_BACKEND_MESSAGE_CODES.has(error.code) && error.message) {
      return error.message;
    }
    const mapped = FRIENDLY_MESSAGES[error.code];
    if (mapped) {
      return mapped;
    }
  }
  return GENERIC_MESSAGE;
}
