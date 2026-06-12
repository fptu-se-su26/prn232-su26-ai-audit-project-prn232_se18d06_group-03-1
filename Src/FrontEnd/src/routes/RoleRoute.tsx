import { Navigate, Outlet } from "react-router-dom";
import { hasRole, useAuthStore } from "@/features/auth/hooks/useAuth";
import type { UserRole } from "@/features/auth/types";

type RoleRouteProps = {
  roles: UserRole[];
};

export default function RoleRoute({ roles }: RoleRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!hasRole(user, roles)) {
    return <Navigate to="/khong-co-quyen" replace />;
  }

  return <Outlet />;
}
