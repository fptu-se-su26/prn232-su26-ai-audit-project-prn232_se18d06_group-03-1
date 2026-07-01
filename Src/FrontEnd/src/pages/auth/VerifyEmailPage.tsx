import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import OtpInput from "@/components/common/OtpInput";
import { showToast } from "@/components/common/toastStore";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { resendOtp, verifyOtp } from "@/features/auth/services/authService";
import type { OtpPurpose } from "@/features/auth/types";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { validateEmail, validateOtp } from "@/utils/validation";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const purpose = (searchParams.get("purpose") as OtpPurpose | null) ?? "Register";
  const fromParam = searchParams.get("from");
  const canSubmit = useMemo(() => email.trim().length > 0 && otp.length === 6 && !isSubmitting, [email, otp, isSubmitting]);

  function validate() {
    const nextEmailError = validateEmail(email);
    const nextOtpError = validateOtp(otp);
    setEmailError(nextEmailError);
    setOtpError(nextOtpError);
    return !nextEmailError && !nextOtpError;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp({ email: email.trim(), otp, purpose });
      showToast({ type: "success", title: "Xác thực thành công", message: "Bạn có thể đăng nhập vào MoveVN." });
      navigate(fromParam ? "/login" : "/login", { state: fromParam ? { from: { pathname: fromParam } } : undefined, replace: true });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    setApiError("");
    if (nextEmailError) {
      return;
    }

    setIsResending(true);
    try {
      await resendOtp({ email: email.trim(), purpose });
      showToast({ type: "success", title: "Đã gửi lại OTP", message: "Vui lòng kiểm tra hộp thư của bạn." });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout title="Xác thực email" description="Nhập mã OTP gồm 6 chữ số MoveVN đã gửi tới email của bạn.">
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
        <OtpInput disabled={isSubmitting} error={otpError} onChange={setOtp} value={otp} />

        <Button className="w-full" disabled={!canSubmit} isLoading={isSubmitting} size="lg" type="submit">
          Xác thực
        </Button>
        <Button isLoading={isResending} onClick={handleResendOtp} type="button" variant="secondary">
          Gửi lại OTP
        </Button>

        <p className="text-center text-sm text-slate-600">
          Đã xác thực?{" "}
          <Link className="font-semibold text-brand-700 hover:text-brand-800" to="/login">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
