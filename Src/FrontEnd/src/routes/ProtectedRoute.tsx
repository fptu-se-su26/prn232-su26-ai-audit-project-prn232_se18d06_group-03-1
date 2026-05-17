import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/hooks/useAuth";

export default function ProtectedRoute() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
