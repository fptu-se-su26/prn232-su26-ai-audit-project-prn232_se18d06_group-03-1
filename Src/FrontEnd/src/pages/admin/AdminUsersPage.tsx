import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/common/Alert";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import useClickOutside from "@/hooks/useClickOutside";
import { getAdminUsers } from "@/features/admin/services/adminUserService";
import type { AdminUserListItem } from "@/features/admin/types";
import { usePresenceStore } from "@/features/presence/usePresence";

const PAGE_SIZE = 10;

const sortOptions = [
  { value: "", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "name_asc", label: "Tên A-Z" },
  { value: "name_desc", label: "Tên Z-A" },
];

const roleOptions = ["Admin", "Staff", "Owner", "Customer"];
const statusOptions = ["Active", "Pending", "Suspended", "Deleted"];

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlineFilter, setOnlineFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const presenceUsers = usePresenceStore((state) => state.users);
  const hydrateUsers = usePresenceStore((state) => state.hydrateUsers);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadUsers = useCallback(async (p: number, kw: string, sort: string, role: string, status: string, online: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page: p,
        pageSize: PAGE_SIZE,
        keyword: kw || undefined,
        sortBy: sort || undefined,
        role: role || undefined,
        status: status || undefined,
        isOnline: online === "online" ? true : online === "offline" ? false : undefined,
      };
      const result = await getAdminUsers(params as any);
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
  }, [hydrateUsers]);

  useEffect(() => {
    void loadUsers(1, "", "", "", "", "");
  }, [loadUsers]);

  function handleSearch() {
    setPage(1);
    void loadUsers(1, keyword, sortBy, roleFilter, statusFilter, onlineFilter);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleSort(v: string) {
    setSortBy(v);
    setPage(1);
    void loadUsers(1, keyword, v, roleFilter, statusFilter, onlineFilter);
  }

  function handleRoleFilter(v: string) {
    setRoleFilter(v);
    setPage(1);
    void loadUsers(1, keyword, sortBy, v, statusFilter, onlineFilter);
  }

  function handleStatusFilter(v: string) {
    setStatusFilter(v);
    setPage(1);
    void loadUsers(1, keyword, sortBy, roleFilter, v, onlineFilter);
  }

  function handleOnlineFilter(v: string) {
    setOnlineFilter(v);
    setPage(1);
    void loadUsers(1, keyword, sortBy, roleFilter, statusFilter, v);
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    void loadUsers(p, keyword, sortBy, roleFilter, statusFilter, onlineFilter);
  }

  function resetFilters() {
    setKeyword("");
    setSortBy("");
    setRoleFilter("");
    setStatusFilter("");
    setOnlineFilter("");
    setPage(1);
    if (searchRef.current) searchRef.current.value = "";
    void loadUsers(1, "", "", "", "", "");
  }

  const hasActiveFilters = sortBy || roleFilter || statusFilter || onlineFilter;

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
          <h1 className="text-2xl font-semibold text-slate-950">Quản lý người dùng</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi tài khoản, vai trò và trạng thái hoạt động.</p>
        </div>
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
              label="Vai trò"
              value={roleFilter}
              onChange={handleRoleFilter}
              options={[{ value: "", label: "Tất cả" }, ...roleOptions.map((r) => ({ value: r, label: r }))]}
            />

            <FilterDropdown
              label="Trạng thái"
              value={statusFilter}
              onChange={handleStatusFilter}
              options={[{ value: "", label: "Tất cả" }, ...statusOptions.map((s) => ({ value: s, label: s }))]}
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
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Hoạt động</th>
                <th className="px-4 py-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{user.fullName}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                    {user.phone && <div className="text-xs text-slate-400">{user.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((role) => (
                        <span key={role} className="rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${
                      user.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                      user.status === "Pending" ? "bg-amber-100 text-amber-700" :
                      user.status === "Suspended" ? "bg-red-100 text-red-700" :
                      user.status === "Deleted" ? "bg-slate-200 text-slate-600" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {user.status}
                    </span>
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
                </tr>
              ))}

              {!isLoading && visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
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
    </div>
  );
}
