import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import { useAuthStore } from "@/features/auth/hooks/useAuth";

export default function GuestRoute() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (token && user) {
    return <Navigate to={getDashboardPath(user.roles)} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
