import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import PageLoader from "@/components/common/PageLoader";
import Alert from "@/components/common/Alert";
import { showToast } from "@/components/common/toastStore";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getCurrentUser, updateProfile, uploadAvatar } from "@/features/auth/services/authService";
import { getFriendlyAuthError } from "@/features/auth/utils/authErrors";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isLoading, setIsLoading] = useState(!user);
  const [apiError, setApiError] = useState("");

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const currentUser = await getCurrentUser();
        if (!ignore) {
          updateUser(currentUser);
          setFullName(currentUser.fullName ?? "");
          setPhone(currentUser.phone ?? "");
        }
      } catch (error) {
        if (!ignore) setApiError(getFriendlyAuthError(error));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    if (!user) void load();
    else setIsLoading(false);
    return () => { ignore = true; };
  }, [user, updateUser]);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) return;
    setIsSaving(true);
    try {
      const partial = await updateProfile({ fullName: fullName.trim(), phone: phone.trim() || null });
      if (avatarFile) {
        const url = await uploadAvatar(avatarFile);
        partial.avatarUrl = url;
      }
      updateUser({ ...user, ...partial, roles: user?.roles ?? [] } as any);
      showToast({ type: "success", title: "Thành công", message: "Hồ sơ đã được cập nhật." });
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getFriendlyAuthError(error) });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <PageLoader label="Đang tải hồ sơ..." />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/account" className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Quay lại tổng quan
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin cá nhân và ảnh đại diện</p>

        {apiError ? <div className="mt-4"><Alert variant="error">{apiError}</Alert></div> : null}

        <div className="mt-8 space-y-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed text-3xl font-bold shadow-md transition ${
                  isDragOver
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-300 bg-gradient-to-br from-brand-500 to-brand-700 text-white"
                }`}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full rounded-full object-cover" />
                ) : user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
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
            <p className="text-xs text-slate-400">Kéo thả ảnh hoặc nhấn vào camera. JPG, PNG, WebP. Tối đa 5MB.</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Nhập họ và tên"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">Email không thể thay đổi</p>
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-6">
            <Link to="/account" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Hủy
              </Button>
            </Link>
            <Button type="button" className="flex-1" onClick={handleSave} disabled={isSaving || !fullName.trim()}>
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</> : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
