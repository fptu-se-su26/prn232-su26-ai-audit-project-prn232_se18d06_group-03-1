import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import PasswordField from "@/components/common/PasswordField";
import { showToast } from "@/components/common/toastStore";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { registerOwnerOnboarding } from "@/features/owner/services/ownerService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { validateConfirmPassword, validateEmail, validateFullName, validatePassword, validatePhone } from "@/utils/validation";

type FormFields = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

export default function OwnerRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormFields>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () =>
      form.fullName.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.phone.trim().length > 0 &&
      form.password.length > 0 &&
      form.confirmPassword.length > 0 &&
      !isSubmitting,
    [form, isSubmitting],
  );

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const nextErrors: FormErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    };

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as keyof FormFields]) {
        delete nextErrors[key as keyof FormFields];
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await registerOwnerOnboarding({
        ...form,
        email: form.email.trim(),
        phone: form.phone.trim(),
        fullName: form.fullName.trim(),
      });
      showToast({ type: "success", title: "Đăng ký thành công", message: "MoveVN đã gửi OTP tới email của bạn." });
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}&purpose=Register&from=/become-owner`, { replace: true });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Đăng ký chủ xe" description="Tạo tài khoản và đăng ký làm chủ xe trên MoveVN!">
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
    </AuthLayout>
  );
}