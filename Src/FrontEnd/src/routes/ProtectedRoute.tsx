import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { clearToken, setUser } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/services/authService";

type ProtectedRouteProps = {
  allowedRoles?: string[];
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(Boolean(token) && !user);

  useEffect(() => {
    let active = true;

    if (!token || user) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          clearToken();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token, user]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (loading) {
    return <div className="px-4 py-12 text-sm text-zinc-500">Loading account context...</div>;
  }

  if (allowedRoles && user && !allowedRoles.some((role) => user.roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
