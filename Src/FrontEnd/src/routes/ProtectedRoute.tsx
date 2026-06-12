import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/services/authService";

export default function ProtectedRoute() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isLoading, setIsLoading] = useState(Boolean(token && !user));

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      if (!token || user) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!ignore) {
          updateUser(currentUser);
        }
      } catch {
        if (!ignore) {
          clearSession();
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      ignore = true;
    };
  }, [clearSession, token, updateUser, user]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return <PageLoader label="Đang kiểm tra phiên đăng nhập..." />;
  }

  return <Outlet />;
}
