import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, CreditCard, FileBadge, IdCard, KeyRound, Landmark, Mail, Monitor } from "lucide-react";
import Alert from "@/components/common/Alert";
import PageLoader from "@/components/common/PageLoader";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { getMyDriverLicense } from "@/features/driverLicenses/services/driverLicenseService";
import type { DriverLicenseStatusResponse } from "@/features/driverLicenses/types";
import { getMyApplication } from "@/features/owner/services/ownerService";
import type { OwnerApplicationDto } from "@/features/owner/types";

const roleLabels: Record<string, string> = {
  Admin: "Quản trị",
  Staff: "Nhân viên",
  Owner: "Chủ xe",
  Customer: "Khách hàng",
};

function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Đã xác minh
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      <AlertCircle className="h-3 w-3" />
      Chưa xác minh
    </span>
  );
}

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(!user);
  const [ownerApp, setOwnerApp] = useState<OwnerApplicationDto | null>(null);
  const [driverLicense, setDriverLicense] = useState<DriverLicenseStatusResponse | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const currentUser = await getCurrentUser();
        if (!ignore) updateUser(currentUser);
      } catch (error) {
        if (!ignore) setApiError(getFriendlyAuthError(error));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    async function loadOwnerApp() {
      try {
        const app = await getMyApplication();
        if (!ignore && app?.id > 0) setOwnerApp(app);
      } catch { /* ignore */ }
    }
    async function loadDriverLicense() {
      try {
        const data = await getMyDriverLicense();
        if (!ignore) setDriverLicense(data);
      } catch { /* ignore */ }
    }
    void load();
    void loadOwnerApp();
    void loadDriverLicense();
    return () => { ignore = true; };
  }, [updateUser]);

  if (isLoading) {
    return <PageLoader label="Đang tải thông tin tài khoản..." />;
  }

  return (
    <div className="space-y-6">
      {apiError ? <Alert variant="error">{apiError}</Alert> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="shrink-0">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-slate-200 sm:h-20 sm:w-20">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-bold text-slate-400">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{user?.fullName || "-"}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {user?.roles?.map((role) => {
                const colorMap: Record<string, string> = {
                  Customer: "bg-blue-50 text-blue-700 ring-blue-200",
                  Owner: "bg-amber-50 text-amber-700 ring-amber-200",
                  Staff: "bg-cyan-50 text-cyan-700 ring-cyan-200",
                  Admin: "bg-rose-50 text-rose-700 ring-rose-200",
                };
                return (
                  <span key={role} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${colorMap[role] || "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                    {roleLabels[role] || role}
                  </span>
                );
              })}
            </div>
            <p className="text-sm text-slate-500">{user?.email || "-"}</p>
          </div>
          <Link
            to="/account/profile"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-brand-700 sm:self-center"
          >
            Xem hồ sơ
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Xác minh danh tính</h2>
          <Link to="/account/verification" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            Chi tiết
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Mail, label: "Email", verified: user?.isEmailVerified ?? false },
            { icon: IdCard, label: "CCCD", verified: ownerApp?.nationalIdVerified ?? false },
            { icon: FileBadge, label: "GPLX", verified: driverLicense?.verified ?? false },
            { icon: Landmark, label: "Ngân hàng", verified: ownerApp?.bankInfoCompleted ?? false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.verified ? "bg-emerald-100" : "bg-slate-100"}`}>
                <item.icon className={`h-4 w-4 ${item.verified ? "text-emerald-600" : "text-slate-400"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <VerifiedBadge verified={item.verified} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuickLink to="/account/security/password" icon={KeyRound} title="Đổi mật khẩu" description="Cập nhật mật khẩu tài khoản" color="orange" />
        <QuickLink to="/account/security/sessions" icon={Monitor} title="Phiên đăng nhập" description="Quản lý thiết bị đã đăng nhập" color="blue" />
        <QuickLink to="/account/verification/cccd" icon={CreditCard} title="Xác thực CCCD" description="Căn cước công dân" color="purple" />
        <QuickLink to="/account/bank" icon={Landmark} title="Thông tin ngân hàng" description="Quản lý tài khoản thụ hưởng" color="emerald" />
      </div>
    </div>
  );
}

function QuickLink({
  color,
  description,
  icon: Icon,
  title,
  to,
}: {
  color: "orange" | "blue" | "purple" | "emerald";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  to: string;
}) {
  const colors = {
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };
  return (
    <Link to={to} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold text-slate-900 group-hover:text-brand-700">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
