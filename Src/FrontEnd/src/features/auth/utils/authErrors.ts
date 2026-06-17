import { toApiError } from "@/features/auth/services/authService";

const errorMessages: Record<string, string> = {
  "401": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "403": "Bạn không có quyền thực hiện thao tác này.",
  "404": "Không tìm thấy dữ liệu phù hợp.",
  "422": "Thông tin nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
  "500": "Hệ thống đang bận. Vui lòng thử lại sau.",
  AUTH_1001: "Email này đã tồn tại.",
  AUTH_1002: "Email hoặc mật khẩu không đúng.",
  AUTH_1003: "Email chưa được xác thực. Vui lòng xác thực OTP trước khi đăng nhập.",
  AUTH_1004: "Không tìm thấy tài khoản với email này.",
  AUTH_1005: "Tài khoản đã bị khóa.",
  AUTH_1006: "Vai trò không hợp lệ.",
  AUTH_1010: "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau.",
  AUTH_1011: "OTP không đúng hoặc đã hết hạn.",
  AUTH_1012: "OTP đã được sử dụng.",
  AUTH_1013: "Không gửi được email OTP. Vui lòng thử lại sau.",
  AUTH_1020: "Refresh token không hợp lệ. Vui lòng đăng nhập lại.",
  AUTH_1021: "Refresh token đã hết hạn. Vui lòng đăng nhập lại.",
  AUTH_1030: "Mật khẩu xác nhận không khớp.",
  AUTH_1031: "Mật khẩu hiện tại không đúng.",
  AUTH_1007: "Số điện thoại này đã tồn tại.",
  NETWORK: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
};

export function getFriendlyAuthError(error: unknown) {
  const apiError = toApiError(error);
  if (errorMessages[apiError.code]) {
    return errorMessages[apiError.code];
  }

  if (apiError.message && apiError.message !== "Yêu cầu không thành công." && apiError.message !== "Đã có lỗi xảy ra. Vui lòng thử lại.") {
    return apiError.message;
  }

  return "Yêu cầu không thành công. Vui lòng thử lại.";
}
