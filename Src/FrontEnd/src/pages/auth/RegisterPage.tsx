import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import PasswordField from "@/components/common/PasswordField";
import { showToast } from "@/components/common/toastStore";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { register, type RegisterPayload } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { validateConfirmPassword, validateEmail, validateFullName, validatePassword, validatePhone } from "@/utils/validation";

type RegisterErrors = Partial<Record<keyof RegisterPayload, string>>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterPayload>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Customer",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const canSubmit = useMemo(
    () =>
      form.fullName.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.phone.trim().length > 0 &&
      form.password.length > 0 &&
      form.confirmPassword.length > 0 &&
      termsAccepted &&
      !isSubmitting,
    [form, termsAccepted, isSubmitting],
  );

  function updateField<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const nextErrors: RegisterErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
      role: form.role === "Customer" || form.role === "Owner" ? "" : "Chỉ được đăng ký vai trò Customer hoặc Owner.",
    };

    if (!termsAccepted) {
      showToast({ type: "error", title: "Chưa đồng ý điều khoản", message: "Vui lòng đọc và đồng ý với chính sách và điều khoản sử dụng." });
      return false;
    }

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as keyof RegisterPayload]) {
        delete nextErrors[key as keyof RegisterPayload];
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ ...form, email: form.email.trim(), phone: form.phone.trim(), fullName: form.fullName.trim() });
      showToast({ type: "success", title: "Đăng ký thành công", message: "MoveVN đã gửi OTP tới email của bạn." });
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}&purpose=Register`, { replace: true });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Đăng ký" description="Chào mừng bạn đến với MoveVN!">
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        {apiError ? <Alert variant="error">{apiError}</Alert> : null}

        <FormField
          autoComplete="name"
          error={errors.fullName}
          label="Họ và tên"
          maxLength={200}
          name="fullName"
          onChange={(event) => updateField("fullName", event.target.value)}
          placeholder="Nguyễn Văn A"
          value={form.fullName}
        />
        <FormField
          autoComplete="email"
          error={errors.email}
          label="Email"
          maxLength={256}
          name="email"
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="ban@email.com"
          type="email"
          value={form.email}
        />
        <FormField
          autoComplete="tel"
          error={errors.phone}
          label="Số điện thoại"
          maxLength={10}
          name="phone"
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="0912345678"
          type="tel"
          value={form.phone}
        />
        <PasswordField
          autoComplete="new-password"
          error={errors.password}
          helperText="Tối thiểu 8 ký tự."
          label="Mật khẩu"
          name="password"
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Tạo mật khẩu"
          value={form.password}
        />
        <PasswordField
          autoComplete="new-password"
          error={errors.confirmPassword}
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          onChange={(event) => updateField("confirmPassword", event.target.value)}
          placeholder="Nhập lại mật khẩu"
          value={form.confirmPassword}
        />

        <label className="flex items-start gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
          />
          <span>
            Tôi đã đọc và đồng ý với{" "}
            <a href="/policies/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline hover:text-brand-800">
              Chính sách bảo mật
            </a>{" "}
            và{" "}
            <a href="/policies/terms-of-service" target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline hover:text-brand-800">
              Điều khoản sử dụng
            </a>{" "}
            của MoveVN.
          </span>
        </label>

        <Button className="w-full" disabled={!canSubmit} isLoading={isSubmitting} size="lg" type="submit">
          Đăng ký
        </Button>

        <p className="pt-2 text-center text-sm font-medium text-slate-600">
          Đã có tài khoản?{" "}
          <Link className="font-bold text-[#6b19ff] hover:text-[#5215a2] transition-colors" to="/login">
            Đăng nhập ngay
          </Link>
        </p>
      </form>

      <p className="mt-4 text-center text-sm font-medium text-slate-600">
        Hoặc{" "}
        <Link className="font-bold text-[#6b19ff] hover:text-[#5215a2] transition-colors" to="/register-owner">
          đăng ký làm chủ xe
        </Link>
      </p>
    </AuthLayout>
  );
}
