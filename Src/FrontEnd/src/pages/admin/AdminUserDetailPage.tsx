import { ArrowLeft, BadgeCheck, Briefcase, Calendar, CheckCircle, CreditCard, Eye, History, IdCard, Laptop, Mail, Monitor, Phone, Shield, Smartphone, Star, User, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import UserStatusToggle from "@/components/common/UserStatusToggle";
import { getAdminUserById, getAdminUserAuditLogs, getAdminUserSessions, revokeAdminUserSession, updateAdminUser, updateUserRole, updateUserStatus } from "@/features/admin/services/adminUserService";
import type { AdminLoginSession, AdminUserDetail, UserManagementAuditLogItem } from "@/features/admin/types";
import type { UserRole } from "@/features/auth/types";

const roleLabels: Record<string, string> = {
  Admin: "Quản trị",
  Staff: "Nhân viên",
  Owner: "Chủ xe",
  Customer: "Khách hàng",
};

const roleIcons: Record<string, typeof Shield> = {
  Admin: Shield,
  Staff: Briefcase,
  Owner: CreditCard,
  Customer: User,
};

const roleColors: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  Admin: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", activeBg: "bg-purple-100" },
  Staff: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", activeBg: "bg-blue-100" },
  Owner: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", activeBg: "bg-orange-100" },
  Customer: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", activeBg: "bg-emerald-100" },
};

const statusConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  Active: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Hoạt động" },
  Pending: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", label: "Chờ duyệt" },
  Suspended: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", label: "Đã khóa" },
  Deleted: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600", label: "Đã xóa" },
};

const editableRoles = ["Staff", "Owner", "Customer"];
const AdminRoleIcon = roleIcons.Admin;

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState<{ action: "suspend" | "activate" | "delete" | "restore" } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [sessions, setSessions] = useState<AdminLoginSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [roleUpdating, setRoleUpdating] = useState("");
  const [revokingSessionId, setRevokingSessionId] = useState("");
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<UserManagementAuditLogItem[]>([]);
  const [auditLogsModalOpen, setAuditLogsModalOpen] = useState(false);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  const loadUser = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminUserById(Number(id));
      if (!data) {
        setError("Không tìm thấy người dùng.");
      } else {
        setUser(data);
      }
    } catch {
      setError("Không thể tải thông tin người dùng.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const loadSessions = useCallback(async () => {
    if (!id) return;
    setSessionsLoading(true);
    setSessionsError("");
    try {
      setSessions(await getAdminUserSessions(Number(id)));
    } catch {
      setSessionsError("Không thể tải các phiên đăng nhập.");
    } finally {
      setSessionsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const loadAuditLogs = useCallback(async () => {
    if (!id) return;
    setAuditLogsLoading(true);
    try {
      setAuditLogs(await getAdminUserAuditLogs(Number(id)));
    } catch {
      // silently fail
    } finally {
      setAuditLogsLoading(false);
    }
  }, [id]);

  function openEditModal() {
    if (!user) return;
    setEditName(user.fullName);
    setEditPhone(user.phone ?? "");
    setEditError("");
    setEditModalOpen(true);
  }

  async function handleSaveEdit() {
    if (!user || !editName.trim()) {
      setEditError("Họ tên không được để trống.");
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      await updateAdminUser(user.userId, {
        fullName: editName.trim(),
        phone: editPhone.trim() || null,
      });
      setEditModalOpen(false);
      void loadUser();
    } catch {
      setEditError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleRole(role: string, assigned: boolean) {
    if (!user || role === "Admin") return;
    setRoleUpdating(role);
    setError(null);
    try {
      await updateUserRole(user.userId, { role, assigned });
      setUser((current) => {
        if (!current) return current;
        const nextRoles = assigned
          ? [...new Set([...current.roles, role as UserRole])]
          : current.roles.filter((item) => item !== role);
        return { ...current, roles: nextRoles };
      });
    } catch {
      setError("Không thể cập nhật vai trò.");
    } finally {
      setRoleUpdating("");
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!user || !window.confirm("Đăng xuất phiên này khỏi tài khoản?")) return;
    setRevokingSessionId(sessionId);
    setSessionsError("");
    try {
      await revokeAdminUserSession(user.userId, sessionId);
      setSessions((items) => items.map((item) => item.sessionId === sessionId ? { ...item, isActive: false } : item));
    } catch {
      setSessionsError("Không thể thu hồi phiên đăng nhập.");
    } finally {
      setRevokingSessionId("");
    }
  }

  async function handleStatusAction() {
    if (!user || !statusModal) return;
    setStatusLoading(true);
    try {
      let newStatus: string;
      switch (statusModal.action) {
        case "suspend": newStatus = "Suspended"; break;
        case "activate": newStatus = "Active"; break;
        case "delete": newStatus = "Deleted"; break;
        case "restore": newStatus = "Active"; break;
        default: return;
      }
      await updateUserStatus(user.userId, { status: newStatus });
      setStatusModal(null);
      void loadUser();
    } catch {
      setError("Thao tác thất bại, vui lòng thử lại.");
    } finally {
      setStatusLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate("/admin/users")}>
          Quay lại
        </Button>
      </div>
    );
  }

  if (!user) return null;

  const status = statusConfig[user.status] ?? { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-700", label: user.status };
  const hasProfile = user.customerProfile || user.ownerProfile || user.staffProfile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900">Chi tiết người dùng</h1>
          <p className="mt-0.5 text-sm text-slate-500">Quản lý thông tin và vai trò tài khoản.</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Profile card + Audit Log */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Avatar & Name */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="relative inline-block">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white ring-4 ring-white shadow">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white ${status.dot}`} />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{user.fullName}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                {user.isOnline && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                )}
              </div>
            </div>

            {/* Info list */}
            <div className="border-t border-slate-100 px-6 py-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="truncate text-slate-700">{user.email}</p>
                </div>
                {user.isEmailVerified ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                )}
              </div>

              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <Phone className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">Điện thoại</p>
                    <p className="text-slate-700">{user.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Calendar className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Ngày tạo</p>
                  <p className="text-slate-700">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">ID</p>
                  <p className="text-slate-700 font-mono text-xs">{user.userId}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Trạng thái</span>
                <UserStatusToggle
                  isActive={user.status === "Active"}
                  userName={user.fullName}
                  onToggle={() => setStatusModal({ action: user.status === "Active" ? "suspend" : "activate" })}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={openEditModal}>
                  Chỉnh sửa
                </Button>
                {user.status === "Active" && (
                  <Button variant="secondary" size="sm" className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => setStatusModal({ action: "suspend" })}>
                    Khóa
                  </Button>
                )}
                {user.status === "Suspended" && (
                  <Button variant="secondary" size="sm" className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => setStatusModal({ action: "activate" })}>
                    Mở khóa
                  </Button>
                )}
                {user.status === "Deleted" && (
                  <Button variant="secondary" size="sm" className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => setStatusModal({ action: "restore" })}>
                    Khôi phục
                  </Button>
                )}
                {user.status !== "Deleted" && (
                  <Button variant="secondary" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setStatusModal({ action: "delete" })}>
                    Xóa
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Audit Log - Left column */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={() => { void loadAuditLogs().then(() => setAuditLogsModalOpen(true)); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <History className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Lịch sử thay đổi</h3>
                  <p className="text-xs text-slate-500">Xem ai đã thay đổi tài khoản.</p>
                </div>
              </div>
              <Eye className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roles */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                <Shield className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Vai trò</h3>
                <p className="text-sm text-slate-500">Chủ xe có thể đồng thời là khách hàng hoặc nhân viên.</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {user.roles.includes("Admin") && (
                <div className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center ${roleColors.Admin.activeBg} ${roleColors.Admin.text} ${roleColors.Admin.border}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${roleColors.Admin.bg}`}>
                    <AdminRoleIcon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{roleLabels.Admin}</span>
                  <CheckCircle className="absolute right-2 top-2 h-4 w-4 text-current" />
                  <span className="text-[10px] font-medium opacity-80">Do hệ thống quản lý</span>
                </div>
              )}
              {editableRoles.map((role) => {
                const assigned = user.roles.includes(role as UserRole);
                const colors = roleColors[role];
                const Icon = roleIcons[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleToggleRole(role, !assigned)}
                    disabled={Boolean(roleUpdating)}
                    className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                      assigned
                        ? `${colors.activeBg} ${colors.text} ${colors.border}`
                        : "border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      assigned ? colors.bg : "bg-slate-100 group-hover:bg-slate-200"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{roleLabels[role]}</span>
                    {assigned && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-4 w-4 text-current" />
                      </div>
                    )}
                    {roleUpdating === role && <span className="absolute inset-x-0 bottom-1 text-[10px] font-medium">Đang lưu...</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login sessions */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Monitor className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Phiên đăng nhập</h3>
                  <p className="text-sm text-slate-500">Thiết bị đã đăng nhập và trạng thái phiên hiện tại.</p>
                </div>
              </div>
              <Button disabled={sessionsLoading} onClick={loadSessions} size="sm" variant="ghost">Làm mới</Button>
            </div>

            {sessionsError && <div className="px-6 pt-4"><Alert variant="error">{sessionsError}</Alert></div>}
            {sessionsLoading ? (
              <div className="flex justify-center py-10"><LoadingSpinner className="h-5 w-5" /></div>
            ) : sessions.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">Chưa có dữ liệu phiên đăng nhập hợp lệ.</p>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {sessions.slice(0, 5).map((session) => (
                    <SessionItem key={session.sessionId} session={session} revokingSessionId={revokingSessionId} onRevoke={handleRevokeSession} />
                  ))}
                </div>
                {sessions.length > 5 && (
                  <div className="border-t border-slate-100 px-6 py-3 text-center">
                    <button type="button" onClick={() => setSessionsModalOpen(true)} className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
                      Xem thêm ({sessions.length} phiên)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Profiles & Verification */}
          {hasProfile && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                  <BadgeCheck className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Hồ sơ & Xác minh</h3>
                  <p className="text-sm text-slate-500">Thông tin xác minh danh tính và hồ sơ.</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Customer Profile */}
                {user.customerProfile && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-sm font-semibold text-slate-900">Khách hàng</h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <VerificationItem
                        icon={<IdCard className="h-4 w-4" />}
                        label="CCCD"
                        verified={user.customerProfile.nationalIdVerified}
                        extra={user.customerProfile.nationalIdMasked}
                      />
                      <VerificationItem
                        icon={<CreditCard className="h-4 w-4" />}
                        label="GPLX"
                        verified={user.customerProfile.driverLicenseVerified}
                      />
                      {user.customerProfile.dateOfBirth && (
                        <InfoItem label="Ngày sinh" value={user.customerProfile.dateOfBirth} />
                      )}
                      {user.customerProfile.address && (
                        <InfoItem label="Địa chỉ" value={user.customerProfile.address} />
                      )}
                      {user.customerProfile.preferredVehicleType && (
                        <InfoItem label="Loại xe ưa thích" value={user.customerProfile.preferredVehicleType} />
                      )}
                    </div>
                  </div>
                )}

                {/* Owner Profile */}
                {user.ownerProfile && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                      <h4 className="text-sm font-semibold text-slate-900">Chủ xe</h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <VerificationItem
                        icon={<BadgeCheck className="h-4 w-4" />}
                        label="Xác minh"
                        verified={user.ownerProfile.isVerified}
                        extra={user.ownerProfile.verifiedAt ? new Date(user.ownerProfile.verifiedAt).toLocaleDateString("vi-VN") : undefined}
                      />
                      <InfoItem label="Hạng" value={user.ownerProfile.tier} />
                      <InfoItem label="Số chuyến" value={String(user.ownerProfile.totalTrips)} />
                      {user.ownerProfile.averageRating != null && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-400" />
                          <div>
                            <p className="text-xs text-slate-400">Đánh giá</p>
                            <p className="text-sm font-medium text-slate-700">{user.ownerProfile.averageRating.toFixed(1)} / 5.0</p>
                          </div>
                        </div>
                      )}
                      {user.ownerProfile.bankName && (
                        <InfoItem label="Ngân hàng" value={user.ownerProfile.bankName} />
                      )}
                      {user.ownerProfile.bankAccountHolderName && (
                        <InfoItem label="Chủ tài khoản" value={user.ownerProfile.bankAccountHolderName} />
                      )}
                    </div>
                  </div>
                )}

                {/* Staff Profile */}
                {user.staffProfile && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-slate-900">Nhân viên</h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoItem label="Mã nhân viên" value={user.staffProfile.employeeCode} />
                      {user.staffProfile.department && (
                        <InfoItem label="Bộ phận" value={user.staffProfile.department} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} title="Chỉnh sửa thông tin" onClose={() => setEditModalOpen(false)}>
        <div className="space-y-4">
          <FormField
            label="Họ và tên"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nhập họ tên"
          />
          <FormField
            label="Số điện thoại"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="Nhập số điện thoại"
          />
          {editError && <p className="text-xs font-medium text-rose-600">{editError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Hủy</Button>
            <Button isLoading={saving} onClick={handleSaveEdit}>Lưu</Button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={!!statusModal}
        title={
          statusModal?.action === "delete" ? "Xác nhận xóa mềm" :
          statusModal?.action === "restore" ? "Xác nhận khôi phục" :
          statusModal?.action === "suspend" ? "Xác nhận khóa tài khoản" :
          "Xác nhận mở khóa"
        }
        onClose={() => setStatusModal(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {statusModal?.action === "delete" && "Tài khoản sẽ không thể đăng nhập nhưng dữ liệu vẫn được giữ."}
            {statusModal?.action === "restore" && "Tài khoản sẽ trở lại trạng thái hoạt động."}
            {statusModal?.action === "suspend" && "Tài khoản sẽ bị khóa và không thể đăng nhập."}
            {statusModal?.action === "activate" && "Tài khoản sẽ được mở khóa và có thể đăng nhập lại."}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStatusModal(null)}>Hủy</Button>
            <Button
              isLoading={statusLoading}
              onClick={handleStatusAction}
              className={statusModal?.action === "delete" || statusModal?.action === "suspend" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {statusModal?.action === "delete" && "Xóa"}
              {statusModal?.action === "restore" && "Khôi phục"}
              {statusModal?.action === "suspend" && "Khóa tài khoản"}
              {statusModal?.action === "activate" && "Mở khóa"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* All Sessions Modal */}
      <Modal isOpen={sessionsModalOpen} title="Tất cả phiên đăng nhập" onClose={() => setSessionsModalOpen(false)} className="max-w-2xl">
        <div className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <SessionItem key={session.sessionId} session={session} revokingSessionId={revokingSessionId} onRevoke={handleRevokeSession} />
          ))}
        </div>
      </Modal>

      {/* Audit Log Modal */}
      <Modal isOpen={auditLogsModalOpen} title="Lịch sử thay đổi" onClose={() => setAuditLogsModalOpen(false)} className="max-w-2xl">
        <div className="space-y-4">
          {auditLogsLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner className="h-5 w-5" /></div>
          ) : auditLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Chưa có lịch sử thay đổi.</p>
          ) : (
            <div className="relative space-y-0">
              {auditLogs.map((log, idx) => (
                <div key={log.id ?? idx} className="relative flex gap-4 pb-6 pl-8">
                  {idx < auditLogs.length - 1 && (
                    <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-slate-200" />
                  )}
                  <div className="absolute left-[5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand-400 bg-white" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900">{log.action === "AssignRole" ? `Phân vai trò: ${log.newValue ?? ""}` :
                        log.action === "RemoveRole" ? `Gỡ vai trò: ${log.newValue ?? ""}` :
                        log.action === "update_user_info" ? "Cập nhật thông tin" :
                        log.action === "CreateUser" ? `Tạo tài khoản (${log.newValue ?? ""})` : log.action}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Thực hiện bởi <span className="font-medium text-slate-700">{log.actorName}</span>
                      {log.actorRole === "Staff" ? " (Nhân viên)" : log.actorRole === "Admin" ? " (Quản trị)" : ""}
                    </p>
                    {log.oldValue && log.newValue && (
                      <p className="mt-1 text-xs text-slate-400 break-words">
                        <span className="line-through text-red-400">{log.oldValue}</span>
                        {" → "}
                        <span className="text-emerald-600">{log.newValue}</span>
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.timestamp))}
                      {log.ipAddress && ` · IP: ${log.ipAddress}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function VerificationItem({ icon, label, verified, extra }: { icon: React.ReactNode; label: string; verified: boolean; extra?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${verified ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium ${verified ? "text-emerald-700" : "text-slate-500"}`}>
            {verified ? "Đã xác minh" : "Chưa xác minh"}
          </span>
          {extra && <span className="text-xs text-slate-400">({extra})</span>}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function describeSessionDevice(userAgent?: string | null) {
  if (!userAgent) return { label: "Thiết bị không xác định", mobile: false };
  const mobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
  const browser = /Edg\//.test(userAgent) ? "Microsoft Edge"
    : /Chrome\//.test(userAgent) ? "Google Chrome"
      : /Firefox\//.test(userAgent) ? "Mozilla Firefox"
        : /Safari\//.test(userAgent) ? "Safari" : "Trình duyệt";
  const os = /Windows/i.test(userAgent) ? "Windows"
    : /Android/i.test(userAgent) ? "Android"
      : /iPhone|iPad|Mac OS/i.test(userAgent) ? "Apple"
        : /Linux/i.test(userAgent) ? "Linux" : "thiết bị không xác định";
  return { label: `${browser} trên ${os}`, mobile };
}

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function SessionItem({ session, revokingSessionId, onRevoke }: { session: AdminLoginSession; revokingSessionId: string; onRevoke: (id: string) => void }) {
  const device = describeSessionDevice(session.deviceType);
  const DeviceIcon = device.mobile ? Smartphone : Laptop;
  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100">
          <DeviceIcon className="h-4 w-4 text-slate-600" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{device.label}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${session.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {session.isActive ? "Đang hoạt động" : "Đã hết phiên"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">IP: {session.ipAddress || "Không xác định"}</p>
          <p className="mt-0.5 text-xs text-slate-400">Đăng nhập lúc {formatSessionDate(session.signedInAt)}</p>
        </div>
      </div>
      {session.isActive && (
        <Button isLoading={revokingSessionId === session.sessionId} onClick={() => onRevoke(session.sessionId)} size="sm" variant="secondary">
          Đăng xuất
        </Button>
      )}
    </div>
  );
}
