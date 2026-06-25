import { UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getAdminUsers } from "@/features/admin/services/adminUserService";
import type { AdminUserListItem } from "@/features/admin/types";
import { usePresenceStore } from "@/features/presence/usePresence";

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
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const presenceUsers = usePresenceStore((state) => state.users);
  const hydrateUsers = usePresenceStore((state) => state.hydrateUsers);

  async function loadUsers(searchKeyword = keyword) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAdminUsers(searchKeyword.trim());
      setUsers(result);
      hydrateUsers(result.map((user) => ({
        userId: user.userId,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt,
      })));
    } catch {
      setError("Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Quản lý người dùng</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi tài khoản, vai trò và trạng thái hoạt động.</p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm tên, email, SĐT"
            className="sm:w-72"
          />
          <Button type="button" onClick={() => void loadUsers(keyword)}>
            Tìm
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <UsersRound className="h-4 w-4 text-brand-700" />
            {visibleUsers.length} người dùng
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
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
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
      </div>
    </div>
  );
}
