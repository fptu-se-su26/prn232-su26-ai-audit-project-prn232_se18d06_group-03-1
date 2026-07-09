export const driverLicenseStatusLabel: Record<string, string> = {
  None: "Chưa xác minh",
  Pending: "Chờ nhân viên duyệt",
  Processing: "Đang xử lý",
  Verified: "Đã xác minh",
  NeedMoreInfo: "Cần bổ sung",
  Rejected: "Bị từ chối",
  Failed: "Xử lý thất bại",
  Pass: "Đạt",
  ManualReview: "Cần nhân viên kiểm tra",
  Reject: "Không đạt",
};

const flagLabels: Record<string, string> = {
  IMAGE_TOO_BLURRY: "Ảnh bị mờ",
  IMAGE_TOO_DARK: "Ảnh quá tối",
  IMAGE_TOO_BRIGHT: "Ảnh quá sáng",
  IMAGE_TOO_SMALL: "Ảnh quá nhỏ",
  DOCUMENT_NOT_READABLE: "Không đọc được giấy tờ",
  NO_TEXT_DETECTED: "Không phát hiện chữ trên ảnh",
  DRIVER_LICENSE_NUMBER_NOT_FOUND: "Không tìm thấy số GPLX",
  LICENSE_CLASS_NOT_FOUND: "Không tìm thấy hạng GPLX",
  LICENSE_CLASS_NOT_RECOGNIZED_IN_VIETNAM: "Hạng GPLX không hợp lệ tại Việt Nam",
  FULL_NAME_NOT_FOUND: "Không tìm thấy họ tên",
  FULL_NAME_MISMATCH: "Họ tên trên GPLX không khớp hồ sơ",
  LICENSE_CLASS_UNCERTAIN: "Chưa chắc chắn hạng GPLX",
  MINISTRY_MARKER_NOT_FOUND: "Không tìm thấy cơ quan cấp",
  NATIONAL_MOTTO_NOT_FOUND: "Không tìm thấy quốc hiệu",
  DRIVER_LICENSE_TITLE_NOT_FOUND: "Không nhận diện tiêu đề GPLX",
  LOW_OCR_CONFIDENCE: "Độ tin cậy OCR thấp",
  OCR_ENGINE_UNAVAILABLE: "Dịch vụ OCR chưa sẵn sàng",
  OCR_PROCESSING_FAILED: "OCR xử lý thất bại",
  IMAGE_DECODE_FAILED: "Không đọc được file ảnh",
};

export function formatDriverLicenseFlags(flags?: string[] | null) {
  return (flags ?? []).map((flag) => flagLabels[flag] ?? flag);
}

export function translateDriverLicenseMessage(message?: string | null, fallback = "Vui lòng kiểm tra lại ảnh GPLX.") {
  if (!message) return fallback;
  const normalized = message.toLowerCase();
  if (normalized.includes("no readable text") || normalized.includes("ocr did not return")) {
    return "Không đọc được thông tin trên GPLX. Vui lòng chụp lại ảnh rõ hơn.";
  }
  if (normalized.includes("markers") || normalized.includes("license class")) {
    return "AI đã đọc được ảnh nhưng cần kiểm tra lại dấu hiệu giấy tờ hoặc hạng GPLX.";
  }
  if (normalized.includes("ocr.space api key")) {
    return "Dịch vụ OCR chưa được cấu hình. Vui lòng thử lại sau.";
  }
  if (normalized.includes("driver license verification passed")) {
    return "AI đã xác minh GPLX thành công.";
  }
  if (normalized.includes("requires staff review")) {
    return "AI chưa đủ chắc chắn, hồ sơ cần nhân viên kiểm tra.";
  }
  return message;
}
