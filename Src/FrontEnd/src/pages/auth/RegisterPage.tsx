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
import { validateConfirmPassword, validateEmail, validateFullName, validatePassword } from "@/utils/validation";

type RegisterErrors = Partial<Record<keyof RegisterPayload, string>>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterPayload>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Customer",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () =>
      form.fullName.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.password.length > 0 &&
      form.confirmPassword.length > 0 &&
      !isSubmitting,
    [form, isSubmitting],
  );

  function updateField<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const nextErrors: RegisterErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
      role: form.role === "Customer" || form.role === "Owner" ? "" : "Chỉ được đăng ký vai trò Customer hoặc Owner.",
    };

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
      await register({ ...form, email: form.email.trim(), fullName: form.fullName.trim() });
      showToast({ type: "success", title: "Đăng ký thành công", message: "MoveVN đã gửi OTP tới email của bạn." });
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}&purpose=Register`, { replace: true });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Tạo tài khoản" description="Đăng ký tài khoản khách hàng hoặc chủ xe trên MoveVN.">
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

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Vai trò</span>
          <div className="grid grid-cols-2 gap-2">
            {(["Customer", "Owner"] as const).map((role) => (
              <button
                key={role}
                type="button"
                className={[
                  "rounded-md border px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                  form.role === role
                    ? "border-brand-600 bg-brand-50 text-brand-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                onClick={() => updateField("role", role)}
              >
                {role === "Customer" ? "Khách hàng" : "Chủ xe"}
              </button>
            ))}
          </div>
          {errors.role ? <p className="text-xs font-medium text-rose-600">{errors.role}</p> : null}
        </div>

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

        <p className="text-center text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link className="font-semibold text-brand-700 hover:text-brand-800" to="/login">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
