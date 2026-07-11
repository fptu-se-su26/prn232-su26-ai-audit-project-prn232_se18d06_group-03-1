import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import PasswordField from "@/components/common/PasswordField";
import { showToast } from "@/components/common/toastStore";
import { changePassword } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { validateConfirmPassword, validatePassword } from "@/utils/validation";

type ChangeErrors = {
  confirmPassword?: string;
  currentPassword?: string;
  newPassword?: string;
};

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ChangeErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const nextErrors: ChangeErrors = {
      currentPassword: currentPassword ? "" : "Vui lòng nhập mật khẩu hiện tại.",
      newPassword: validatePassword(newPassword, "Mật khẩu mới"),
      confirmPassword: validateConfirmPassword(newPassword, confirmPassword),
    };

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as keyof ChangeErrors]) {
        delete nextErrors[key as keyof ChangeErrors];
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
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast({ type: "success", title: "Đổi mật khẩu thành công", message: "Mật khẩu tài khoản đã được cập nhật." });
    } catch (error) {
      setApiError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/account" className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Quay lại tổng quan
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Lock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h1>
            <p className="text-sm text-slate-500">Cập nhật mật khẩu cho phiên đăng nhập hiện tại.</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {apiError ? <Alert variant="error">{apiError}</Alert> : null}
          <PasswordField
            autoComplete="current-password"
            error={errors.currentPassword}
            label="Mật khẩu hiện tại"
            name="currentPassword"
            onChange={(event) => setCurrentPassword(event.target.value)}
            value={currentPassword}
          />
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
          <div className="border-t border-slate-100 pt-5">
            <Button className="w-full sm:w-auto" isLoading={isSubmitting} type="submit">
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
