import { AlertCircle, CheckCircle2, Megaphone, Send, Users } from "lucide-react";
import { useState } from "react";
import Button from "@/components/common/Button";
import { broadcastNotification, type BroadcastNotificationRequest } from "@/features/notifications/broadcastService";
import { getApiErrorMessage } from "@/services/apiClient";

const CHANNEL_OPTIONS = [
  { value: "InApp", label: "In-app (chuông thông báo)" },
  { value: "Email", label: "Email" },
  { value: "Both", label: "Cả hai (In-app + Email)" },
];

const TARGET_OPTIONS = [
  { value: "All", label: "Tất cả người dùng" },
  { value: "ByRole", label: "Theo nhóm vai trò" },
  { value: "ByUser", label: "Theo tài khoản cụ thể" },
];

const ROLE_OPTIONS = [
  { value: "Customer", label: "Customer (Khách hàng)" },
  { value: "Owner", label: "Owner (Chủ xe)" },
  { value: "Staff", label: "Staff (Nhân viên)" },
  { value: "Admin", label: "Admin (Quản trị viên)" },
];

const defaultForm: BroadcastNotificationRequest = {
  title: "",
  body: "",
  channel: "InApp",
  targetType: "All",
  targetRoles: [],
  targetUserIds: [],
};

interface ResultState {
  totalTargeted: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

export default function AdminBroadcastNotificationPage() {
  const [form, setForm] = useState<BroadcastNotificationRequest>(defaultForm);
  const [userIdsInput, setUserIdsInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  function handleRoleToggle(role: string) {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    // Parse userId input
    const parsedIds = userIdsInput
      .split(/[\s,;]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

    const payload: BroadcastNotificationRequest = {
      ...form,
      targetUserIds: form.targetType === "ByUser" ? parsedIds : [],
      targetRoles: form.targetType === "ByRole" ? form.targetRoles : [],
    };

    if (!payload.title.trim() || !payload.body.trim()) {
      setError("Tiêu đề và nội dung không được để trống.");
      return;
    }

    if (payload.targetType === "ByRole" && payload.targetRoles.length === 0) {
      setError("Vui lòng chọn ít nhất một vai trò.");
      return;
    }

    if (payload.targetType === "ByUser" && payload.targetUserIds.length === 0) {
      setError("Vui lòng nhập ít nhất một User ID hợp lệ.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await broadcastNotification(payload);
      setResult(res);
      if (res.successCount > 0) {
        setForm(defaultForm);
        setUserIdsInput("");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Gửi thông báo thất bại. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  }

  const channelLabel = CHANNEL_OPTIONS.find((o) => o.value === form.channel)?.label ?? form.channel;
  const targetLabel = TARGET_OPTIONS.find((o) => o.value === form.targetType)?.label ?? form.targetType;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Quản trị hệ thống</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-950">
          <Megaphone className="h-6 w-6 text-brand-600" />
          Gửi thông báo hàng loạt
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gửi thông báo in-app hoặc email đến nhóm người dùng được chọn.
        </p>
      </div>

      {/* Result banner */}
      {result ? (
        <div
          className={[
            "mb-6 rounded-xl border p-4",
            result.failedCount === 0
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50",
          ].join(" ")}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`h-5 w-5 ${result.failedCount === 0 ? "text-emerald-600" : "text-amber-600"}`}
            />
            <p className={`text-sm font-semibold ${result.failedCount === 0 ? "text-emerald-800" : "text-amber-800"}`}>
              Gửi xong!
            </p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
              <p className="text-xl font-bold text-slate-900">{result.totalTargeted}</p>
              <p className="text-xs text-slate-500">Tổng đối tượng</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
              <p className="text-xl font-bold text-emerald-600">{result.successCount}</p>
              <p className="text-xs text-slate-500">Thành công</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
              <p className="text-xl font-bold text-red-500">{result.failedCount}</p>
              <p className="text-xs text-slate-500">Thất bại</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-amber-700">
                Xem chi tiết lỗi ({result.errors.length})
              </summary>
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-white p-3 text-xs text-red-600">
                {result.errors.map((e, i) => (
                  <li key={i} className="border-b border-slate-100 py-1 last:border-0">
                    {e}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : null}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {/* Nội dung thông báo */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nội dung thông báo</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="broadcast-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                id="broadcast-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                maxLength={200}
                placeholder="VD: Bảo trì hệ thống ngày 25/07"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label htmlFor="broadcast-body" className="mb-1.5 block text-sm font-medium text-slate-700">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                id="broadcast-body"
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                rows={4}
                maxLength={2000}
                placeholder="Nội dung chi tiết của thông báo..."
                className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{form.body.length}/2000</p>
            </div>
          </div>
        </div>

        {/* Kênh gửi */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Kênh gửi</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {CHANNEL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all",
                  form.channel === opt.value
                    ? "border-brand-400 bg-brand-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="channel"
                  value={opt.value}
                  checked={form.channel === opt.value}
                  onChange={() => setForm((prev) => ({ ...prev, channel: opt.value }))}
                  className="accent-brand-600"
                />
                <span className="text-sm font-medium text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Đối tượng nhận */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="h-4 w-4 text-slate-500" />
            Đối tượng nhận
          </h2>
          <div className="space-y-3">
            {TARGET_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all",
                  form.targetType === opt.value
                    ? "border-brand-400 bg-brand-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="targetType"
                  value={opt.value}
                  checked={form.targetType === opt.value}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, targetType: opt.value, targetRoles: [], targetUserIds: [] }))
                  }
                  className="accent-brand-600"
                />
                <span className="text-sm font-medium text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* ByRole: chọn role */}
          {form.targetType === "ByRole" && (
            <div className="mt-4 rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-700">Chọn vai trò</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLE_OPTIONS.map((role) => (
                  <label
                    key={role.value}
                    className={[
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                      form.targetRoles.includes(role.value)
                        ? "border-brand-400 bg-white shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={form.targetRoles.includes(role.value)}
                      onChange={() => handleRoleToggle(role.value)}
                      className="accent-brand-600"
                    />
                    <span className="text-sm text-slate-700">{role.label}</span>
                  </label>
                ))}
              </div>
              {form.targetRoles.length > 0 && (
                <p className="mt-2 text-xs text-brand-700">
                  Đã chọn: {form.targetRoles.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* ByUser: nhập userId */}
          {form.targetType === "ByUser" && (
            <div className="mt-4 rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">Nhập User ID</p>
              <textarea
                id="broadcast-user-ids"
                value={userIdsInput}
                onChange={(e) => setUserIdsInput(e.target.value)}
                rows={3}
                placeholder="Nhập các User ID, ngăn cách bằng dấu phẩy hoặc xuống dòng&#10;VD: 1, 2, 3"
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                Các ID hợp lệ: {userIdsInput.split(/[\s,;]+/).filter((s) => /^\d+$/.test(s.trim())).length} user
              </p>
            </div>
          )}
        </div>

        {/* Summary + submit */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Tóm tắt:</span> Gửi thông báo qua{" "}
            <span className="font-semibold text-brand-700">{channelLabel}</span> đến{" "}
            <span className="font-semibold text-brand-700">{targetLabel}</span>.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Send className="h-4 w-4" />
            Gửi thông báo
          </Button>
        </div>
      </form>
    </div>
  );
}
