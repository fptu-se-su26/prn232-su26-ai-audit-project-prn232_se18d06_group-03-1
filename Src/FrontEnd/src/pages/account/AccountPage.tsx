import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import PageLoader from "@/components/common/PageLoader";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(!user);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!ignore) {
          updateUser(currentUser);
        }
      } catch (error) {
        if (!ignore) {
          setApiError(getFriendlyAuthError(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      ignore = true;
    };
  }, [updateUser]);

  if (isLoading) {
    return <PageLoader label="Đang tải thông tin tài khoản..." />;
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <section>
        <h1 className="text-3xl font-bold text-slate-950">Tài khoản của tôi</h1>
        <p className="mt-2 text-sm text-slate-600">Thông tin phiên đăng nhập hiện tại trên MoveVN.</p>
      </section>

      {apiError ? <Alert variant="error">{apiError}</Alert> : null}

      <Card className="rounded-md">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">Họ và tên</dt>
            <dd className="mt-1 font-semibold text-slate-950">{user?.fullName ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Email</dt>
            <dd className="mt-1 font-semibold text-slate-950">{user?.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Trạng thái</dt>
            <dd className="mt-1 font-semibold text-slate-950">{user?.status ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Vai trò</dt>
            <dd className="mt-1 font-semibold text-slate-950">{user?.roles.join(", ") || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Xác thực email</dt>
            <dd className="mt-1 font-semibold text-slate-950">{user?.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <Link to="/change-password">
            <Button type="button">Đổi mật khẩu</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
