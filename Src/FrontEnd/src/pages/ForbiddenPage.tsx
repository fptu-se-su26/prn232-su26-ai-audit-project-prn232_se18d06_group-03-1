import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";

export default function ForbiddenPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState
        title="Không có quyền truy cập"
        description="Tài khoản hiện tại không có vai trò phù hợp để mở khu vực này."
        action={
          <Link to={getDashboardPath(user?.roles ?? [])}>
            <Button type="button" className="gap-2">
              <ShieldX className="h-4 w-4" />
              Về khu vực của tôi
            </Button>
          </Link>
        }
      />
    </div>
  );
}
