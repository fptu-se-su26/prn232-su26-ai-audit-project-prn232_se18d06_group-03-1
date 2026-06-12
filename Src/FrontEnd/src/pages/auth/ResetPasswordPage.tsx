import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import OtpInput from "@/components/common/OtpInput";
import PasswordField from "@/components/common/PasswordField";
import { showToast } from "@/components/common/toastStore";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { resendOtp, resetPassword } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { validateConfirmPassword, validateEmail, validateOtp, validatePassword } from "@/utils/validation";

type ResetErrors = {
  confirmPassword?: string;
  email?: string;
  newPassword?: string;
  otp?: string;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  function validate() {
    const nextErrors: ResetErrors = {
      email: validateEmail(email),
      otp: validateOtp(otp),
      newPassword: validatePassword(newPassword, "Mật khẩu mới"),
      confirmPassword: validateConfirmPassword(newPassword, confirmPassword),
    };

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as keyof ResetErrors]) {
        delete nextErrors[key as keyof ResetErrors];
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
      await resetPassword({ email: email.trim(), otp, newPassword, confirmPassword });
      showToast({ type: "success", title: "Đặt lại mật khẩu thành công", message: "Bạn có thể đăng nhập bằng mật khẩu mới." });
      navigate("/login", { replace: true });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    const nextEmailError = validateEmail(email);
    setErrors((current) => ({ ...current, email: nextEmailError || undefined }));
    setApiError("");
    if (nextEmailError) {
      return;
    }

    setIsResending(true);
    try {
      await resendOtp({ email: email.trim(), purpose: "ForgotPassword" });
      showToast({ type: "success", title: "Đã gửi lại OTP", message: "Vui lòng kiểm tra email của bạn." });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout title="Đặt lại mật khẩu" description="Nhập OTP và mật khẩu mới cho tài khoản MoveVN.">
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        {apiError ? <Alert variant="error">{apiError}</Alert> : null}
        <FormField
          autoComplete="email"
          error={errors.email}
          label="Email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ban@email.com"
          type="email"
          value={email}
        />
        <OtpInput disabled={isSubmitting} error={errors.otp} onChange={setOtp} value={otp} />
        <PasswordField
          autoComplete="new-password"
          error={errors.newPassword}
          label="Mật khẩu mới"
          name="newPassword"
          onChange={(event) => setNewPassword(event.target.value)}
          value={newPassword}
        />
        <PasswordField
          autoComplete="new-password"
          error={errors.confirmPassword}
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          value={confirmPassword}
        />
        <Button className="w-full" isLoading={isSubmitting} size="lg" type="submit">
          Đặt lại mật khẩu
        </Button>
        <Button isLoading={isResending} onClick={handleResendOtp} type="button" variant="secondary">
          Gửi lại OTP
        </Button>
        <Link className="text-center text-sm font-semibold text-brand-700 hover:text-brand-800" to="/login">
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthLayout>
  );
}
