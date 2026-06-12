import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Facebook, LockKeyhole, Mail } from "lucide-react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import PasswordField from "@/components/common/PasswordField";
import { showToast } from "@/components/common/toastStore";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { setSession } from "@/features/auth/hooks/useAuth";
import { login } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import { validateEmail } from "@/utils/validation";

type LoginErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const expired = searchParams.get("expired") === "1";

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0 && !isSubmitting, [email, password, isSubmitting]);

  function validate() {
    const nextErrors: LoginErrors = {};
    nextErrors.email = validateEmail(email);
    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    }

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as keyof LoginErrors]) {
        delete nextErrors[key as keyof LoginErrors];
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
      const result = await login({ email: email.trim(), password });
      setSession({ token: result.token, user: result.user });
      showToast({ type: "success", title: "Đăng nhập thành công", message: `Chào mừng ${result.user.fullName}.` });

      const fromState = location.state as { from?: { pathname?: string } } | null;
      navigate(fromState?.from?.pathname ?? getDashboardPath(result.user.roles), { replace: true });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Đăng nhập" description="Chào mừng bạn quay lại MoveVN!">
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        {expired ? <Alert variant="warning">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</Alert> : null}
        {apiError ? <Alert variant="error">{apiError}</Alert> : null}

        <FormField
          autoComplete="email"
          error={errors.email}
          label="Email"
          labelHidden
          leftIcon={<Mail className="h-4 w-4" />}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Nhập email của bạn"
          type="email"
          value={email}
          className="h-12 rounded-xl border-slate-200 text-sm shadow-sm"
        />
        <PasswordField
          autoComplete="current-password"
          error={errors.password}
          label="Mật khẩu"
          labelHidden
          leftIcon={<LockKeyhole className="h-4 w-4" />}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nhập mật khẩu"
          value={password}
          className="h-12 rounded-xl border-slate-200 text-sm shadow-sm"
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 font-medium text-slate-600">
            <input
              checked={rememberMe}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            Ghi nhớ đăng nhập
          </label>
          <Link className="font-semibold text-brand-700 hover:text-brand-800" to="/forgot-password">
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          className="mt-1 h-12 w-full rounded-xl bg-gradient-to-r from-[#5b00ff] to-[#8c18ff] text-base shadow-lg shadow-brand-700/25 hover:from-[#4b00dd] hover:to-[#7a0df0]"
          disabled={!canSubmit}
          isLoading={isSubmitting}
          size="lg"
          type="submit"
        >
          Đăng nhập
        </Button>

        <div className="my-1 flex items-center gap-5 text-sm font-medium text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>Hoặc đăng nhập với</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed"
            title="Backend hiện chưa hỗ trợ đăng nhập Google"
          >
            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed"
            title="Backend hiện chưa hỗ trợ đăng nhập Facebook"
          >
            <Facebook className="h-6 w-6 text-[#1877f2]" />
            Facebook
          </button>
        </div>

        <p className="pt-2 text-center text-sm font-medium text-slate-700">
          Chưa có tài khoản?{" "}
          <Link className="font-bold text-brand-700 hover:text-brand-800" to="/register">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
