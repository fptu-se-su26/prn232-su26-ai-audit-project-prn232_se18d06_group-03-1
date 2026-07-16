import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Laptop, Monitor, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import { clearSession, useAuth } from "@/features/auth/hooks/useAuth";
import {
  getLoginSessions,
  revokeLoginSession,
  revokeOtherLoginSessions,
  type LoginSession,
} from "@/features/auth/services/loginSessionService";
import { getApiErrorMessage } from "@/services/apiClient";

function describeDevice(userAgent?: string | null) {
  if (!userAgent) return { label: "Thiết bị không xác định", mobile: false };
  const mobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
  const browser = /Edg\//.test(userAgent)
    ? "Microsoft Edge"
    : /Chrome\//.test(userAgent)
      ? "Google Chrome"
      : /Firefox\//.test(userAgent)
        ? "Mozilla Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Trình duyệt";
  const os = /Windows/i.test(userAgent)
    ? "Windows"
    : /Android/i.test(userAgent)
      ? "Android"
      : /iPhone|iPad|Mac OS/i.test(userAgent)
        ? "Apple"
        : /Linux/i.test(userAgent)
          ? "Linux"
          : "thiết bị không xác định";
  return { label: `${browser} trên ${os}`, mobile };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LoginSessionsPage() {
  const navigate = useNavigate();
  const currentSessionId = useAuth().token?.sessionId ?? "";
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const activeSessions = useMemo(() => sessions.filter((session) => session.isActive), [sessions]);

  async function load() {
    setError("");
    setIsLoading(true);
    try {
      setSessions(await getLoginSessions());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không thể tải danh sách phiên đăng nhập."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleRevoke(session: LoginSession) {
    if (!window.confirm("Bạn có chắc muốn đăng xuất thiết bị này?")) return;
    setBusyId(session.sessionId);
    try {
      await revokeLoginSession(session.sessionId);
      if (session.sessionId === currentSessionId) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }
      setSessions((items) => items.map((item) => item.sessionId === session.sessionId ? { ...item, isActive: false } : item));
      showToast({ type: "success", title: "Đã đăng xuất thiết bị", message: "Phiên đăng nhập trên thiết bị đã được thu hồi." });
    } catch (revokeError) {
      setError(getApiErrorMessage(revokeError, "Không thể thu hồi phiên đăng nhập."));
    } finally {
      setBusyId("");
    }
  }

  async function handleRevokeOthers() {
    if (!currentSessionId || !window.confirm("Đăng xuất tất cả thiết bị khác?")) return;
    setBusyId("others");
    try {
      await revokeOtherLoginSessions(currentSessionId);
      setSessions((items) => items.map((item) => item.sessionId === currentSessionId ? item : { ...item, isActive: false }));
      showToast({ type: "success", title: "Đã đăng xuất các thiết bị khác", message: "Tài khoản chỉ còn hoạt động trên thiết bị này." });
    } catch (revokeError) {
      setError(getApiErrorMessage(revokeError, "Không thể thu hồi các phiên đăng nhập khác."));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/account" className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Quay lại tổng quan
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-100">
              <Monitor className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Phiên đăng nhập</h1>
              <p className="mt-1 text-sm text-slate-500">Kiểm tra và đăng xuất các thiết bị đang truy cập tài khoản.</p>
            </div>
          </div>
          <Button disabled={!currentSessionId || activeSessions.length < 2} isLoading={busyId === "others"} onClick={handleRevokeOthers} size="sm" variant="secondary">
            Đăng xuất thiết bị khác
          </Button>
        </div>

        {error ? <div className="mt-5"><Alert variant="error">{error}</Alert></div> : null}

        {isLoading ? (
          <div className="flex justify-center py-14"><LoadingSpinner className="h-7 w-7" /></div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">Chưa có dữ liệu phiên đăng nhập mới.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => {
              const device = describeDevice(session.deviceType);
              const DeviceIcon = device.mobile ? Smartphone : Laptop;
              const isCurrent = session.sessionId === currentSessionId;
              return (
                <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center" key={session.sessionId}>
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100">
                      <DeviceIcon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{device.label}</p>
                        {isCurrent ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"><ShieldCheck className="h-3 w-3" />Thiết bị này</span> : null}
                        {!session.isActive ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Đã hết phiên</span> : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">IP: {session.ipAddress || "Không xác định"}</p>
                      <p className="mt-0.5 text-xs text-slate-400">Đăng nhập lúc {formatDate(session.signedInAt)}</p>
                    </div>
                  </div>
                  {session.isActive ? (
                    <Button isLoading={busyId === session.sessionId} onClick={() => handleRevoke(session)} size="sm" variant="secondary">
                      Đăng xuất
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <Button disabled={isLoading} onClick={load} size="sm" variant="ghost"><RefreshCw className="h-4 w-4" />Làm mới</Button>
        </div>
      </div>
    </div>
  );
}
