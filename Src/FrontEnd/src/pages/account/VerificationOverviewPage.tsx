import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, FileBadge, IdCard, Landmark, Mail } from "lucide-react";
import PageLoader from "@/components/common/PageLoader";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/services/authService";
import { getMyDriverLicense } from "@/features/driverLicenses/services/driverLicenseService";
import type { DriverLicenseStatusResponse } from "@/features/driverLicenses/types";
import { getMyApplication } from "@/features/owner/services/ownerService";
import type { OwnerApplicationDto } from "@/features/owner/types";

type VerificationItem = {
  description: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  to: string;
  verified: boolean;
};

export default function VerificationOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isLoading, setIsLoading] = useState(!user);
  const [ownerApp, setOwnerApp] = useState<OwnerApplicationDto | null>(null);
  const [driverLicense, setDriverLicense] = useState<DriverLicenseStatusResponse | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const currentUser = await getCurrentUser();
        if (!ignore) updateUser(currentUser);
      } catch {
        // Keep cached user if refresh fails.
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    async function loadOwnerApp() {
      try {
        const app = await getMyApplication();
        if (!ignore && app?.id > 0) setOwnerApp(app);
      } catch {
        // Optional data.
      }
    }

    async function loadDriverLicense() {
      try {
        const data = await getMyDriverLicense();
        if (!ignore) setDriverLicense(data);
      } catch {
        // Optional data.
      }
    }

    void load();
    void loadOwnerApp();
    void loadDriverLicense();
    return () => {
      ignore = true;
    };
  }, [updateUser]);

  if (isLoading) return <PageLoader label="Đang tải..." />;

  const items: VerificationItem[] = [
    { icon: Mail, label: "Email", description: user?.email || "-", verified: user?.isEmailVerified ?? false, to: "#" },
    {
      icon: IdCard,
      label: "CCCD / CMND",
      description: "Căn cước công dân",
      verified: ownerApp?.nationalIdVerified ?? false,
      to: "/account/verification/cccd",
    },
    {
      icon: FileBadge,
      label: "Giấy phép lái xe",
      description: driverLicense?.licenseClass ? `Hạng ${driverLicense.licenseClass}` : "Bằng lái xe các hạng",
      verified: driverLicense?.verified ?? false,
      to: "/account/verification/drivers-license",
    },
    {
      icon: Landmark,
      label: "Ngân hàng",
      description: "Tài khoản thụ hưởng",
      verified: ownerApp?.bankInfoCompleted ?? false,
      to: "/account/bank",
    },
  ];

  const verifiedCount = items.filter((item) => item.verified).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <DashboardHeader
        eyebrow="Identity center"
        title="Xác minh danh tính"
        description="Theo dõi các bước xác minh cần thiết để thuê xe, đăng ký làm chủ xe và nhận thanh toán an toàn trên MoveVN."
        actions={
          <StatusBadge tone={verifiedCount === items.length ? "emerald" : "amber"}>
            {`${verifiedCount}/${items.length} đã xác minh`}
          </StatusBadge>
        }
      />

      <SectionPanel title="Checklist xác minh" description="Hoàn tất các mục còn thiếu để tài khoản có đủ điều kiện sử dụng đầy đủ tính năng.">
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`group flex min-h-[120px] items-start justify-between gap-4 rounded-md border p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-950/10 ${
                item.verified
                  ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300"
                  : "border-slate-200 bg-white hover:border-brand-200"
              }`}
            >
              <div className="flex min-w-0 gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ring-1 ${
                    item.verified ? "bg-white text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-1 truncate text-sm text-slate-600">{item.description}</p>
                  <div className="mt-3">
                    <StatusBadge tone={item.verified ? "emerald" : "amber"}>
                      {item.verified ? "Đã xác minh" : "Chưa xác minh"}
                    </StatusBadge>
                  </div>
                </div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
            </Link>
          ))}
        </div>
      </SectionPanel>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-brand-50 p-2 text-brand-700 ring-1 ring-brand-100">
            {verifiedCount === items.length ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-semibold text-slate-950">
              {verifiedCount === items.length ? "Tài khoản đã sẵn sàng" : "Còn bước xác minh cần hoàn tất"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Các bước xác minh giúp giảm rủi ro khi đặt xe, hỗ trợ duyệt hồ sơ nhanh hơn và bảo vệ giao dịch giữa khách hàng với chủ xe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
