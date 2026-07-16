import { ChevronDown, ChevronLeft, ChevronRight, Eye, Plus, Power, Search, SlidersHorizontal, Trash2, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import FormField from "@/components/common/FormField";
import PasswordField from "@/components/common/PasswordField";
import UserStatusToggle from "@/components/common/UserStatusToggle";
import useClickOutside from "@/hooks/useClickOutside";
import { getAdminUsers, updateUserStatus, createStaff } from "@/features/admin/services/adminUserService";
import type { AdminUserListItem, AdminUserListParams } from "@/features/admin/types";
import { usePresenceStore } from "@/features/presence/usePresence";
import { getApiErrorMessage } from "@/services/apiClient";
import CreateCustomerModal from "@/features/admin/components/CreateCustomerModal";
import CreateOwnerModal from "@/features/admin/components/CreateOwnerModal";

const PAGE_SIZE = 10;

const sortOptions = [
  { value: "", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "name_asc", label: "Tên A-Z" },
  { value: "name_desc", label: "Tên Z-A" },
];

const statusOptions = ["Active", "Pending", "Suspended", "Deleted"];

const roleLabels: Record<string, string> = {
  Admin: "Quản trị",
  Staff: "Nhân viên",
  Owner: "Chủ xe",
  Customer: "Khách hàng",
};

const statusLabels: Record<string, { bg: string; text: string; label: string }> = {
  Active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Hoạt động" },
  Pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Chờ duyệt" },
  Suspended: { bg: "bg-red-100", text: "text-red-700", label: "Đã khóa" },
  Deleted: { bg: "bg-slate-200", text: "text-slate-600", label: "Đã xóa" },
};

const statusDescriptions: Record<string, string> = {
  Active: "Có thể đăng nhập",
  Pending: "Chờ xác minh email",
  Suspended: "Bị khóa đăng nhập",
  Deleted: "Đã xóa mềm",
};

function FilterDropdown({ value, label, options, onChange }: { value: string; label: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const current = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
      >
        <span className="text-xs text-slate-400">{label}:</span>
        <span className="font-medium">{current?.label ?? "Tất cả"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="dropdown-scrollbar absolute left-0 top-full z-20 mt-1 max-h-72 w-44 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${
                opt.value === value
                  ? "bg-brand-100 text-brand-700 font-medium"
                  : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatLastSeen(lastSeenAt: string | null) {
  if (!lastSeenAt) return "Chưa có hoạt động";
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

type AdminUserListPageProps = {
  title: string;
  subtitle: string;
  roleFilter: string;
  showRoleColumn?: boolean;
};

export default function AdminUserListPage({ title, subtitle, roleFilter, showRoleColumn = false }: AdminUserListPageProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlineFilter, setOnlineFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const presenceUsers = usePresenceStore((state) => state.users);
  const hydrateUsers = usePresenceStore((state) => state.hydrateUsers);
  const searchRef = useRef<HTMLInputElement>(null);
  const [confirmModal, setConfirmModal] = useState<{ user: AdminUserListItem; action: "delete" | "restore" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", employeeCode: "", department: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadUsers = useCallback(async (p: number, kw: string, sort: string, status: string, online: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: AdminUserListParams = {
        page: p,
        pageSize: PAGE_SIZE,
        keyword: kw || undefined,
        sortBy: sort || undefined,
        role: roleFilter || undefined,
        status: status || undefined,
        isOnline: online === "online" ? true : online === "offline" ? false : undefined,
      };
      const result = await getAdminUsers(params);
      setUsers(result.items);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setTotalPages(result.totalPages);
      hydrateUsers(result.items.map((u) => ({
        userId: u.userId,
        isOnline: u.isOnline,
        lastSeenAt: u.lastSeenAt,
      })));
    } catch {
      setError("Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  }, [hydrateUsers, roleFilter]);

  useEffect(() => {
    void loadUsers(1, "", "", "", "");
  }, [loadUsers]);

  function handleSearch() {
    setPage(1);
    void loadUsers(1, keyword, sortBy, statusFilter, onlineFilter);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleSort(v: string) {
    setSortBy(v);
    setPage(1);
    void loadUsers(1, keyword, v, statusFilter, onlineFilter);
  }

  function handleStatusFilter(v: string) {
    setStatusFilter(v);
    setPage(1);
    void loadUsers(1, keyword, sortBy, v, onlineFilter);
  }

  function handleOnlineFilter(v: string) {
    setOnlineFilter(v);
    setPage(1);
    void loadUsers(1, keyword, sortBy, statusFilter, v);
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    void loadUsers(p, keyword, sortBy, statusFilter, onlineFilter);
  }

  function resetFilters() {
    setKeyword("");
    setSortBy("");
    setStatusFilter("");
    setOnlineFilter("");
    setPage(1);
    if (searchRef.current) searchRef.current.value = "";
    void loadUsers(1, "", "", "", "");
  }

  function handleViewUser(userId: number) {
    navigate(`/admin/users/${userId}`);
  }

  function handleCreated() {
    void loadUsers(page, keyword, sortBy, statusFilter, onlineFilter);
  }

  async function handleToggleStatus(user: AdminUserListItem) {
    const newStatus = user.status === "Active" ? "Suspended" : "Active";
    await updateUserStatus(user.userId, { status: newStatus });
    setUsers((items) => items.map((item) => item.userId === user.userId ? { ...item, status: newStatus } : item));
  }

  async function handleConfirmAction() {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      const newStatus = confirmModal.action === "delete" ? "Deleted" : "Active";
      await updateUserStatus(confirmModal.user.userId, { status: newStatus });
      setUsers((items) => items.map((item) => item.userId === confirmModal.user.userId ? { ...item, status: newStatus } : item));
      setConfirmModal(null);
    } catch {
      setError("Thao tác thất bại, vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateStaff() {
    setCreateError("");
    if (!createForm.fullName.trim()) { setCreateError("Họ tên không được để trống."); return; }
    if (!createForm.email.trim()) { setCreateError("Email không được để trống."); return; }
    if (!createForm.password) { setCreateError("Mật khẩu không được để trống."); return; }
    if (createForm.password !== createForm.confirmPassword) { setCreateError("Mật khẩu xác nhận không khớp."); return; }
    if (!createForm.employeeCode.trim()) { setCreateError("Mã nhân viên không được để trống."); return; }
    setCreateLoading(true);
    try {
      await createStaff({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
        employeeCode: createForm.employeeCode.trim(),
        department: createForm.department.trim() || null,
      });
      setCreateModalOpen(false);
      setCreateForm({ fullName: "", email: "", password: "", confirmPassword: "", employeeCode: "", department: "" });
      void loadUsers(page, keyword, sortBy, statusFilter, onlineFilter);
    } catch (err: unknown) {
      setCreateError(getApiErrorMessage(err, "Có lỗi xảy ra, vui lòng thử lại."));
    } finally {
      setCreateLoading(false);
    }
  }

  const hasActiveFilters = sortBy || statusFilter || onlineFilter;

  const visibleUsers = useMemo(
    () =>
      users.map((user) => {
        const livePresence = presenceUsers[user.userId];
        return livePresence
          ? { ...user, isOnline: livePresence.isOnline, lastSeenAt: livePresence.lastSeenAt }
          : user;
      }),
    [presenceUsers, users],
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {roleFilter === "Owner" ? "Thêm chủ xe" : roleFilter === "Customer" ? "Thêm khách hàng" : "Thêm nhân viên"}
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm tên, email, SĐT..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Search className="h-4 w-4" />
            Tìm
          </button>

          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <FilterDropdown
              label="Sắp xếp"
              value={sortBy}
              onChange={handleSort}
              options={sortOptions}
            />

            <FilterDropdown
              label="Trạng thái"
              value={statusFilter}
              onChange={handleStatusFilter}
              options={[{ value: "", label: "Tất cả" }, ...statusOptions.map((s) => ({ value: s, label: statusLabels[s]?.label ?? s }))]}
            />

            <FilterDropdown
              label="Online"
              value={onlineFilter}
              onChange={handleOnlineFilter}
              options={[
                { value: "", label: "Tất cả" },
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
              ]}
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                Xoá bộ lọc
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <UsersRound className="h-4 w-4 text-brand-700" />
            {totalCount} người dùng
          </div>
          {isLoading && <LoadingSpinner className="h-4 w-4" />}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                {showRoleColumn && <th className="px-4 py-3">Vai trò</th>}
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Hoạt động</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="w-28 px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{user.fullName}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                        {user.phone && <div className="text-xs text-slate-400">{user.phone}</div>}
                      </div>
                    </div>
                  </td>
                  {showRoleColumn && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((role) => (
                          <span key={role} className="rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                            {roleLabels[role] ?? role}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusLabels[user.status]?.bg ?? "bg-slate-100"} ${statusLabels[user.status]?.text ?? "text-slate-600"}`}>
                          {statusLabels[user.status]?.label ?? user.status}
                        </span>
                        <p className="mt-1 text-xs text-slate-400">{statusDescriptions[user.status] ?? "Không xác định"}</p>
                      </div>
                      {(user.status === "Active" || user.status === "Suspended") && (
                        <UserStatusToggle
                          isActive={user.status === "Active"}
                          userName={user.fullName}
                          onToggle={() => handleToggleStatus(user)}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${user.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <div>
                        <div className={`font-medium ${user.isOnline ? "text-emerald-700" : "text-slate-600"}`}>
                          {user.isOnline ? "Online" : "Offline"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.isOnline ? "Đang hoạt động" : formatLastSeen(user.lastSeenAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="w-28 px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                      <Button
                        aria-label="Xem chi tiết"
                        className="w-8 px-0 text-blue-600 hover:bg-transparent hover:text-blue-800"
                        onClick={() => handleViewUser(user.userId)}
                        size="sm"
                        title="Xem chi tiết"
                        variant="ghost"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.status === "Deleted" ? (
                        <Button
                          aria-label="Khôi phục tài khoản"
                          className="w-8 px-0 text-emerald-600 hover:bg-transparent hover:text-emerald-800"
                          onClick={() => setConfirmModal({ user, action: "restore" })}
                          size="sm"
                          title="Khôi phục tài khoản"
                          variant="ghost"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          aria-label="Xóa tài khoản"
                          className="w-8 px-0 text-red-500 hover:bg-transparent hover:text-red-700"
                          onClick={() => setConfirmModal({ user, action: "delete" })}
                          size="sm"
                          title="Xóa tài khoản"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={showRoleColumn ? 6 : 5} className="px-4 py-10 text-center text-sm text-slate-500">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-sm text-slate-500">
              Trang {page} / {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p as number)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-brand-700 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!confirmModal}
        title={confirmModal?.action === "delete" ? "Xác nhận xóa" : "Xác nhận khôi phục"}
        onClose={() => setConfirmModal(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {confirmModal?.action === "delete"
              ? `Bạn có chắc chắn muốn xóa tài khoản "${confirmModal?.user.fullName}"? Tài khoản sẽ không thể đăng nhập nhưng dữ liệu vẫn được giữ.`
              : `Bạn có chắc chắn muốn khôi phục tài khoản "${confirmModal?.user.fullName}"? Tài khoản sẽ trở lại trạng thái hoạt động.`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>
              Hủy
            </Button>
            <Button
              variant={confirmModal?.action === "delete" ? "primary" : "primary"}
              isLoading={actionLoading}
              onClick={handleConfirmAction}
              className={confirmModal?.action === "delete" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmModal?.action === "delete" ? "Xóa" : "Khôi phục"}
            </Button>
          </div>
        </div>
      </Modal>

      {roleFilter === "Customer" && (
        <CreateCustomerModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreated={handleCreated} />
      )}

      {roleFilter === "Owner" && (
        <CreateOwnerModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreated={handleCreated} />
      )}

      {roleFilter === "Staff" && <Modal isOpen={createModalOpen} title="Thêm nhân viên mới" onClose={() => setCreateModalOpen(false)}>
        <div className="space-y-4">
          <FormField
            label="Họ và tên"
            value={createForm.fullName}
            onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            placeholder="Nhập họ tên"
          />
          <FormField
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="Nhập email"
          />
          <PasswordField
            label="Mật khẩu"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Nhập mật khẩu"
          />
          <PasswordField
            label="Xác nhận mật khẩu"
            value={createForm.confirmPassword}
            onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
            placeholder="Nhập lại mật khẩu"
          />
          <FormField
            label="Mã nhân viên"
            value={createForm.employeeCode}
            onChange={(e) => setCreateForm({ ...createForm, employeeCode: e.target.value })}
            placeholder="Nhập mã nhân viên"
          />
          <FormField
            label="Bộ phận (tùy chọn)"
            value={createForm.department}
            onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
            placeholder="Nhập bộ phận"
          />
          {createError && <p className="text-xs font-medium text-rose-600">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Hủy</Button>
            <Button isLoading={createLoading} onClick={handleCreateStaff}>
              <Plus className="h-4 w-4" />
              Tạo nhân viên
            </Button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
