import { FormEvent, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import PasswordField from "@/components/common/PasswordField";
import { showToast } from "@/components/common/toastStore";
import Card from "@/components/ui/Card";
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
    <div className="mx-auto grid max-w-xl gap-6">
      <section>
        <h1 className="text-3xl font-bold text-slate-950">Đổi mật khẩu</h1>
        <p className="mt-2 text-sm text-slate-600">Cập nhật mật khẩu cho phiên đăng nhập hiện tại.</p>
      </section>
      <Card className="rounded-md">
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
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
          <Button className="w-full sm:w-auto" isLoading={isSubmitting} type="submit">
            Cập nhật mật khẩu
          </Button>
        </form>
      </Card>
    </div>
  );
}
