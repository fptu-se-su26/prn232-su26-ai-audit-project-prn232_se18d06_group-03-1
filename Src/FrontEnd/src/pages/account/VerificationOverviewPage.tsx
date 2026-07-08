import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, IdCard, FileBadge, Landmark, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import PageLoader from "@/components/common/PageLoader";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/services/authService";
import { getMyApplication } from "@/features/owner/services/ownerService";
import type { OwnerApplicationDto } from "@/features/owner/types";

type VerificationItem = {
  icon: typeof Mail;
  label: string;
  description: string;
  verified: boolean;
  to: string;
};

export default function VerificationOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isLoading, setIsLoading] = useState(!user);
  const [ownerApp, setOwnerApp] = useState<OwnerApplicationDto | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const currentUser = await getCurrentUser();
        if (!ignore) updateUser(currentUser);
      } catch { /* ignore */ } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    async function loadOwnerApp() {
      try {
        const app = await getMyApplication();
        if (!ignore && app?.id > 0) setOwnerApp(app);
      } catch { /* ignore */ }
    }
    void load();
    void loadOwnerApp();
    return () => { ignore = true; };
  }, [updateUser]);

  if (isLoading) return <PageLoader label="Đang tải..." />;

  const items: VerificationItem[] = [
    { icon: Mail, label: "Email", description: user?.email || "-", verified: user?.isEmailVerified ?? false, to: "#" },
    { icon: IdCard, label: "CCCD / CMND", description: "Căn cước công dân", verified: ownerApp?.nationalIdVerified ?? false, to: "/account/verification/cccd" },
    { icon: FileBadge, label: "Giấy phép lái xe", description: "Bằng lái xe các hạng", verified: false, to: "/account/verification/drivers-license" },
    { icon: Landmark, label: "Ngân hàng", description: "Tài khoản thụ hưởng", verified: ownerApp?.bankInfoCompleted ?? false, to: "/account/bank" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Xác minh danh tính</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý các xác minh và giấy tờ tùy thân</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`group flex items-center gap-4 rounded-xl border p-4 transition ${
              item.verified
                ? "border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-sm"
                : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm"
            }`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              item.verified ? "bg-emerald-100" : "bg-slate-100"
            }`}>
              <item.icon className={`h-5 w-5 ${item.verified ? "text-emerald-600" : "text-slate-500"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500 truncate">{item.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã xác minh
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  <AlertCircle className="h-3 w-3" />
                  Chưa xác minh
                </span>
              )}
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand-500 group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
