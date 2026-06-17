export function isRequired(value: unknown) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isSixDigitOtp(value: string) {
  return /^\d{6}$/.test(value);
}

export function validateFullName(value: string) {
  if (!isRequired(value)) {
    return "Vui lòng nhập họ và tên.";
  }

  if (value.trim().length > 200) {
    return "Họ và tên không được vượt quá 200 ký tự.";
  }

  return "";
}

export function validateEmail(value: string) {
  if (!isRequired(value)) {
    return "Vui lòng nhập email.";
  }

  if (value.trim().length > 256) {
    return "Email không được vượt quá 256 ký tự.";
  }

  if (!isEmail(value)) {
    return "Email không đúng định dạng.";
  }

  return "";
}

export function validatePassword(value: string, label = "Mật khẩu") {
  if (!isRequired(value)) {
    return `Vui lòng nhập ${label.toLowerCase()}.`;
  }

  if (value.length < 8) {
    return `${label} phải có ít nhất 8 ký tự.`;
  }

  return "";
}

export function validateConfirmPassword(password: string, confirmPassword: string) {
  if (!isRequired(confirmPassword)) {
    return "Vui lòng nhập lại mật khẩu.";
  }

  if (password !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp.";
  }

  return "";
}

export function validateOtp(value: string) {
  if (!isRequired(value)) {
    return "Vui lòng nhập mã OTP.";
  }

  if (!isSixDigitOtp(value)) {
    return "Mã OTP phải gồm đúng 6 chữ số.";
  }

  return "";
}

export function validatePhone(value: string) {
  if (!isRequired(value)) {
    return "Vui lòng nhập số điện thoại.";
  }

  if (!/^0\d{9}$/.test(value.trim())) {
    return "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0.";
  }

  return "";
}
