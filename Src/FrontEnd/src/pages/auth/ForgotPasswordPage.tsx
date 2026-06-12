import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import { showToast } from "@/components/common/toastStore";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { forgotPassword } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { validateEmail } from "@/utils/validation";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError("");
    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    if (nextEmailError) {
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      showToast({ type: "success", title: "Đã gửi OTP", message: "Vui lòng kiểm tra email để đặt lại mật khẩu." });
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`, { replace: true });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Quên mật khẩu" description="Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu.">
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        {apiError ? <Alert variant="error">{apiError}</Alert> : null}
        <FormField
          autoComplete="email"
          error={emailError}
          label="Email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ban@email.com"
          type="email"
          value={email}
        />
        <Button className="w-full" isLoading={isSubmitting} size="lg" type="submit">
          Gửi OTP
        </Button>
        <Link className="text-center text-sm font-semibold text-brand-700 hover:text-brand-800" to="/login">
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthLayout>
  );
}
