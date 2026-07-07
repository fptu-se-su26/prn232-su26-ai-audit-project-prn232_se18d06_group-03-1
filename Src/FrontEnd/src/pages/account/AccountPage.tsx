import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Lock, Car, CreditCard, CheckCircle2, Mail, Shield, Camera, Loader2, X } from "lucide-react";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import PageLoader from "@/components/common/PageLoader";
import { showToast } from "@/components/common/toastStore";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getCurrentUser, updateProfile, uploadAvatar } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";
import { getMyApplication } from "@/features/owner/services/ownerService";
import type { OwnerApplicationDto } from "@/features/owner/types";
import type { AuthUser } from "@/features/auth/types";

const roleLabels: Record<string, string> = {
  Admin: "Quản trị",
  Staff: "Nhân viên",
  Owner: "Chủ xe",
  Customer: "Khách hàng",
};

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
      } finally {
        if (!ignore) setOwnerAppLoading(false);
      }
    }

    void load();
    void loadOwnerApp();

    return () => { ignore = true; };
  }, [updateUser]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editingAvatar, setEditingAvatar] = useState<File | null>(null);
  const [editingAvatarPreview, setEditingAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openEditModal() {
    setEditFullName(user?.fullName ?? "");
    setEditPhone(user?.phone ?? "");
    setEditingAvatar(null);
    setEditingAvatarPreview(null);
    setShowEditModal(true);
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditingAvatar(file);
    const reader = new FileReader();
    reader.onload = () => setEditingAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setEditingAvatar(file);
      const reader = new FileReader();
      reader.onload = () => setEditingAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSaveProfile() {
    if (!editFullName.trim()) return;
    setIsSaving(true);
    try {
      const partial = await updateProfile({ fullName: editFullName.trim(), phone: editPhone.trim() || null });
      if (editingAvatar) {
        const url = await uploadAvatar(editingAvatar);
        partial.avatarUrl = url;
      }
      const safeUser = { ...user, ...partial, roles: user?.roles ?? [] } as AuthUser;
      updateUser(safeUser);
      showToast({ type: "success", title: "Thành công", message: "Hồ sơ đã được cập nhật." });
      setShowEditModal(false);
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getFriendlyAuthError(error) });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <PageLoader label="Đang tải thông tin tài khoản..." />;
  }

  const isOwner = user?.roles.includes("Owner") ?? false;

  return (
    <>
    <div className="space-y-6">
      {/* ===== PAGE TITLE ===== */}
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Cài đặt tài khoản</h1>
        <p className="mt-2 text-slate-500">Quản lý danh tính, bảo mật và thông tin tài khoản của bạn</p>
      </div>

      {apiError ? <Alert variant="error">{apiError}</Alert> : null}

      {/* ===== HERO SECTION ===== */}
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-6">
            <div className="h-24 w-24 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-slate-900">{user?.fullName || "-"}</h1>
              <div className="flex flex-wrap gap-2">
                {user?.roles?.map((role) => {
                  const colorMap: Record<string, string> = {
                    Customer: "bg-blue-50 text-blue-700",
                    Owner: "bg-purple-50 text-purple-700",
                    Staff: "bg-orange-50 text-orange-700",
                    Admin: "bg-rose-50 text-rose-700",
                  };
                  return (
                    <span key={role} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${colorMap[role] || "bg-slate-50 text-slate-700"}`}>
                      {roleLabels[role] || role}
                    </span>
                  );
                })}
                {user?.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Xác minh
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{user?.email || "-"}</p>
              <p className="mt-2 text-sm text-slate-900">Chào mừng quay lại 👋</p>
            </div>
          </div>

          <Button type="button" className="w-full gap-2 md:w-auto" onClick={openEditModal}>
            <Edit2 className="h-4 w-4" />
            Chỉnh sửa hồ sơ
          </Button>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Hành động nhanh</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <QuickActionButton icon={Edit2} label="Chỉnh sửa hồ sơ" color="text-blue-600" onClick={openEditModal} />
          <QuickActionButton icon={Lock} label="Đổi mật khẩu" color="text-orange-600" to="/change-password" />
          <QuickActionButton icon={Car} label={isOwner ? "Quản lý xe" : "Trở thành chủ xe"} color="text-green-600" to={isOwner ? "/owner/vehicles" : "/become-owner"} />
          <QuickActionButton icon={CreditCard} label="Quản lý thanh toán" color="text-purple-600" to="/become-owner/bank" />
        </div>
      </div>

      {/* ===== IDENTITY SECTION ===== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Danh tính</h2>
          <p className="text-sm text-slate-500">Quản lý thông tin xác minh của bạn</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {([
            { icon: "🆔", title: "CCCD", status: ownerApp?.nationalIdVerified ? "Đã xác minh" : "Chưa xác minh", statusColor: ownerApp?.nationalIdVerified ? "text-emerald-600" : "text-amber-600", action: "Xem" },
            { icon: "📧", title: "Email", status: user?.isEmailVerified ? "Đã xác minh" : "Chưa xác minh", statusColor: user?.isEmailVerified ? "text-emerald-600" : "text-amber-600", action: "Xem" },
            { icon: "🏦", title: "Tài khoản ngân hàng", status: ownerApp?.bankInfoCompleted ? "Đã xác minh" : "Chưa xác minh", statusColor: ownerApp?.bankInfoCompleted ? "text-emerald-600" : "text-amber-600", action: "Cập nhật" },
          ] as const).map((item, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="text-2xl">{item.icon}</div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  <CheckCircle2 className={`h-5 w-5 ${item.statusColor === "text-emerald-600" ? "text-emerald-600" : "text-slate-300"}`} />
                </div>
                <p className={`text-sm font-medium ${item.statusColor}`}>{item.status}</p>
                <Button variant="secondary" size="sm" className="w-full text-brand-700 hover:bg-brand-50 hover:text-brand-800">
                  {item.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== BANK SECTION ===== */}
      {ownerApp?.bankInfoCompleted ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Thông tin ngân hàng</h2>
            <p className="text-sm text-slate-500">Quản lý tài khoản ngân hàng của bạn</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-600 text-base font-bold text-white">
                    {(ownerApp.bankName || "NH").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{ownerApp.bankName || "-"}</h3>
                    <p className="text-sm text-slate-500">{ownerApp.bankAccountNumber ? `••••• ${ownerApp.bankAccountNumber.slice(-4)}` : "-"}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Tên chủ tài khoản</p>
                    <p className="text-sm font-medium text-slate-900">{ownerApp.bankAccountHolderName || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Xác minh
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-col md:items-end">
                <Link to="/become-owner/bank">
                  <Button type="button" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Cập nhật
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ===== SECURITY SECTION ===== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Bảo mật</h2>
          <p className="text-sm text-slate-500">Quản lý bảo mật và quyền riêng tư của tài khoản</p>
        </div>

        <div className="space-y-3">
          {[
            { icon: Mail, title: "Email", description: user?.email || "", status: user?.isEmailVerified ? "Xác minh" : "Chưa xác minh", statusColor: user?.isEmailVerified ? "text-emerald-600" : "text-amber-600", action: "Thay đổi", to: "" },
            { icon: Lock, title: "Mật khẩu", description: "Cập nhật lần cuối 45 ngày trước", status: "Hoạt động", statusColor: "text-emerald-600", action: "Thay đổi", to: "/change-password" },
            { icon: Shield, title: "Xác thực hai bước (2FA)", description: "Tăng cường bảo mật cho tài khoản", status: "Chưa bật", statusColor: "text-amber-600", action: "Bật", to: "" },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="rounded-lg bg-slate-100 p-3">
                  <item.icon className="h-5 w-5 text-slate-900" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:items-end md:gap-3">
                <span className={`inline-flex items-center gap-1 text-sm font-medium ${item.statusColor}`}>
                  {item.status}
                </span>
                {item.to ? (
                  <Link to={item.to}>
                    <Button variant="secondary" size="sm" className="text-brand-700 hover:bg-brand-50 hover:text-brand-800">
                      {item.action}
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" className="text-brand-700 hover:bg-brand-50 hover:text-brand-800">
                    {item.action}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

      {/* ===== EDIT PROFILE MODAL ===== */}
      {showEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa hồ sơ</h2>
              <button type="button" onClick={() => setShowEditModal(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed text-3xl font-bold shadow-md transition ${
                      isDragOver
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-300 bg-gradient-to-br from-violet-500 to-violet-700 text-white"
                    }`}
                  >
                    {editingAvatarPreview ? (
                      <img src={editingAvatarPreview} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                    ) : user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      user?.fullName?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-700 text-white shadow-sm transition hover:bg-brand-800"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleAvatarSelect} />
                </div>
                <p className="text-xs text-slate-500">Kéo thả ảnh hoặc nhấn vào camera. JPG, PNG, WebP. Tối đa 5MB.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Họ và tên</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
                Hủy
              </Button>
              <Button type="button" className="flex-1" onClick={handleSaveProfile} disabled={isSaving || !editFullName.trim()}>
                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</> : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ===== Quick Action Button ===== */

function QuickActionButton({ icon: Icon, label, color, onClick, to }: { icon: any; label: string; color: string; onClick?: () => void; to?: string }) {
  const classes = "flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 cursor-pointer";

  if (to) {
    return (
      <Link to={to} className={classes}>
        <Icon className={`h-6 w-6 ${color}`} />
        <span className="text-center text-sm font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      <Icon className={`h-6 w-6 ${color}`} />
      <span className="text-center text-sm font-medium">{label}</span>
    </button>
  );
}
