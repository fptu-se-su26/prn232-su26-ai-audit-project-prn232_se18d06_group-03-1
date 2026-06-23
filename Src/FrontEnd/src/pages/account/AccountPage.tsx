import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car, BadgeCheck, Landmark, Fingerprint, ShieldCheck, CreditCard, User } from "lucide-react";
import { Skeleton, SkeletonBadge } from "@/components/common/Skeleton";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import PageLoader from "@/components/common/PageLoader";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { getMyApplication } from "@/features/owner/services/ownerService";
import type { OwnerApplicationDto } from "@/features/owner/types";

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(!user);
  const [ownerApp, setOwnerApp] = useState<OwnerApplicationDto | null>(null);
  const [ownerAppLoading, setOwnerAppLoading] = useState(true);

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
      setOwnerAppLoading(true);
      try {
        const app = await getMyApplication();
        if (!ignore && app?.id > 0) setOwnerApp(app);
      } catch {
        // no application yet
      } finally {
        if (!ignore) setOwnerAppLoading(false);
      }
    }

    void load();
    void loadOwnerApp();

    return () => { ignore = true; };
  }, [updateUser]);

  if (isLoading) {
    return <PageLoader label="Đang tải thông tin tài khoản..." />;
  }

  const isCustomer = user?.roles.includes("Customer") ?? false;
  const isOwner = user?.roles.includes("Owner") ?? false;
  const showOnboarding = isCustomer || isOwner;
  const needCccd = !ownerApp?.nationalIdVerified;
  const needBank = !ownerApp?.bankInfoCompleted;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Cài đặt tài khoản</h1>
        <p className="text-zinc-600">Quản lý danh tính, bảo mật và thông tin tài khoản của bạn.</p>
      </div>

      {apiError ? <div className="mb-4"><Alert variant="error">{apiError}</Alert></div> : null}

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Owner Banner */}
        {showOnboarding ? (
          <section className="relative col-span-12 overflow-hidden rounded-xl bg-gradient-to-br from-purple-800 to-purple-900 p-6 text-white md:flex md:items-center md:justify-between lg:col-span-8">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-purple-600 opacity-20 blur-3xl" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Car className="h-5 w-5" />
                </span>
                {isOwner ? (
                  <h3 className="text-lg font-bold">Bạn đã là chủ xe</h3>
                ) : (
                  <h3 className="text-lg font-bold">Trở thành chủ xe</h3>
                )}
              </div>
              {isOwner ? (
                <p className="max-w-md text-sm text-purple-100">
                  Bạn đã đăng ký thành công chủ xe MoveVN. Quản lý xe cho thuê và theo dõi thu nhập tại trang chủ xe.
                </p>
              ) : (
                <p className="max-w-md text-sm text-purple-100">
                  Đăng ký tài khoản để trở thành chủ xe MoveVN và bắt đầu kiếm thu nhập từ việc cho thuê xe.
                </p>
              )}
            </div>
            {!isOwner ? (
              <Link
                to="/become-owner"
                className="relative z-10 mt-4 whitespace-nowrap rounded-full bg-white px-8 py-3 text-sm font-semibold text-purple-900 shadow-lg transition-transform hover:scale-105 active:scale-95 md:mt-0"
              >
                {!needCccd && !needBank ? "Xem hồ sơ" : "Đăng ký ngay"}
              </Link>
            ) : null}
          </section>
        ) : null}

        {/* Profile Info */}
        <section className={`col-span-12 rounded-xl border border-zinc-100 bg-white/80 p-5 backdrop-blur-sm ${showOnboarding ? "lg:col-span-4" : "lg:col-span-6"}`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900">Thông tin cá nhân</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-zinc-500">Họ và tên</p>
              <p className="text-sm font-medium text-zinc-900">{user?.fullName || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Email</p>
              <p className="text-sm font-medium text-zinc-900">{user?.email || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Trạng thái</p>
              <p className="text-sm font-medium text-zinc-900">{user?.status ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Vai trò</p>
              <p className="text-sm font-medium text-zinc-900">{user?.roles.join(", ") || "-"}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-zinc-100 pt-3">
            <Link to="/change-password">
              <button className="text-sm font-semibold text-purple-700 hover:text-purple-800">
                Đổi mật khẩu
              </button>
            </Link>
          </div>
        </section>

        {/* Verification Status */}
        {showOnboarding ? (
          <section className="col-span-12 rounded-xl border border-zinc-100 bg-white/80 p-5 backdrop-blur-sm md:col-span-6 lg:col-span-4">
            <h3 className="mb-4 text-base font-semibold text-zinc-900">Xác thực</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-purple-700" />
                  <span className="text-sm text-zinc-800">CCCD</span>
                </div>
                {ownerAppLoading ? (
                  <SkeletonBadge />
                ) : ownerApp?.nationalIdVerified ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Đã xác thực</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Chưa xác thực</span>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
                <div className="flex items-center gap-3">
                  <Landmark className="h-5 w-5 text-purple-700" />
                  <span className="text-sm text-zinc-800">Ngân hàng</span>
                </div>
                {ownerAppLoading ? (
                  <SkeletonBadge />
                ) : ownerApp?.bankInfoCompleted ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Đã kết nối</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Chưa kết nối</span>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* System Connections */}
        {showOnboarding ? (
          <section className="col-span-12 rounded-xl border border-zinc-100 bg-white/80 p-5 backdrop-blur-sm md:col-span-6 lg:col-span-4">
            <h3 className="mb-4 text-base font-semibold text-zinc-900">Kết nối hệ thống</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/become-owner/cccd"
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 transition hover:border-purple-200 hover:bg-purple-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <Fingerprint className="h-5 w-5 text-purple-700" />
                </div>
                <span className="text-xs font-semibold text-zinc-800">CCCD</span>
                {ownerAppLoading ? (
                  <Skeleton className="mt-1 h-3 w-16" />
                ) : (
                  <span className={`text-[11px] font-medium ${ownerApp?.nationalIdVerified ? "text-green-600" : "text-zinc-400"}`}>
                    {ownerApp?.nationalIdVerified ? "Đã xác thực" : "Chưa xác thực"}
                  </span>
                )}
              </Link>
              <Link
                to="/become-owner/bank"
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 transition hover:border-purple-200 hover:bg-purple-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <Landmark className="h-5 w-5 text-purple-700" />
                </div>
                <span className="text-xs font-semibold text-zinc-800">Ngân hàng</span>
                {ownerAppLoading ? (
                  <Skeleton className="mt-1 h-3 w-16" />
                ) : (
                  <span className={`text-[11px] font-medium ${ownerApp?.bankInfoCompleted ? "text-green-600" : "text-zinc-400"}`}>
                    {ownerApp?.bankInfoCompleted ? "Đã kết nối" : "Chưa kết nối"}
                  </span>
                )}
              </Link>
            </div>
          </section>
        ) : null}

        {/* Bank Details - show when bank is connected */}
        {showOnboarding && ownerApp?.bankInfoCompleted ? (
          <section className="col-span-12 rounded-xl border border-zinc-100 bg-white/80 p-5 backdrop-blur-sm md:col-span-6">
            <h3 className="mb-4 text-base font-semibold text-zinc-900">Thông tin ngân hàng</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3">
                <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
                <div>
                  <p className="text-xs font-medium text-zinc-500">Ngân hàng</p>
                  <p className="text-sm font-medium text-zinc-900">{ownerApp.bankName || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
                <div>
                  <p className="text-xs font-medium text-zinc-500">Số tài khoản</p>
                  <p className="text-sm font-medium text-zinc-900">{ownerApp.bankAccountNumber || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3">
                <User className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
                <div>
                  <p className="text-xs font-medium text-zinc-500">Chủ tài khoản</p>
                  <p className="text-sm font-medium text-zinc-900">{ownerApp.bankAccountHolderName || "-"}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-zinc-100 pt-3">
              <Link to="/become-owner/bank">
                <button className="text-sm font-semibold text-purple-700 hover:text-purple-800">
                  Cập nhật thông tin ngân hàng
                </button>
              </Link>
            </div>
          </section>
        ) : null}

        {/* Security Section - always visible */}
        <section className="col-span-12 rounded-xl border border-zinc-100 bg-white/80 p-5 backdrop-blur-sm md:col-span-6">
          <h3 className="mb-4 text-base font-semibold text-zinc-900">Bảo mật</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-purple-700" />
                <span className="text-sm text-zinc-800">Xác thực email</span>
              </div>
              <span className={`text-xs font-semibold ${user?.isEmailVerified ? "text-green-600" : "text-amber-600"}`}>
                {user?.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
