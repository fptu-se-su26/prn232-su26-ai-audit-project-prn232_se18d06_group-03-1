import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "@/components/common/PageLoader";
import { showToast } from "@/components/common/toastStore";
import { clearSession, useAuthStore } from "@/features/auth/hooks/useAuth";
import { logout } from "@/features/auth/services/authService";

export default function LogoutPage() {
  const navigate = useNavigate();
  const refreshToken = useAuthStore((state) => state.token?.refreshToken);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) {
      return;
    }
    hasRun.current = true;

    async function signOut() {
      try {
        if (refreshToken) {
          await logout(refreshToken);
        }
      } finally {
        clearSession();
        showToast({ type: "success", title: "Đã đăng xuất", message: "Phiên đăng nhập của bạn đã kết thúc." });
        navigate("/login", { replace: true });
      }
    }

    void signOut();
  }, [navigate, refreshToken]);

  return <PageLoader label="Đang đăng xuất..." />;
}
