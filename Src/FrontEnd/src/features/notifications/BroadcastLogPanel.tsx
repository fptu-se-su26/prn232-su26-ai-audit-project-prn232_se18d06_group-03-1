import { ChevronLeft, ChevronRight, Eye, History, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import FormDropdown from "@/components/common/FormDropdown";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  getBroadcastNotificationLogs,
  type BroadcastNotificationLog,
} from "@/features/notifications/broadcastService";

const statusLabels: Record<string, string> = {
  Completed: "Hoàn tất",
  Partial: "Một phần",
  Failed: "Thất bại",
};

const targetLabels: Record<string, string> = {
  All: "Tất cả người dùng",
  ByRole: "Theo vai trò",
  ByUser: "Theo tài khoản",
};

export default function BroadcastLogPanel({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<BroadcastNotificationLog[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BroadcastNotificationLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBroadcastNotificationLogs({
        keyword: keyword || undefined,
        channel: channel || undefined,
        status: status || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        pageSize: 10,
      });
      setItems(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } finally {
      setLoading(false);
    }
  }, [channel, fromDate, keyword, page, status, toDate]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <History className="h-5 w-5 text-brand-600" />
            Lịch sử gửi thông báo
          </h2>
          <p className="mt-1 text-sm text-slate-500">{totalCount} lần gửi được ghi nhận trong MongoDB.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </button>
      </div>

      <form
        className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setKeyword(keywordDraft.trim());
        }}
      >
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={keywordDraft} onChange={(event) => setKeywordDraft(event.target.value)} placeholder="Tiêu đề hoặc người gửi" className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-400" />
        </div>
        <FormDropdown value={channel} onChange={(value) => { setChannel(value); setPage(1); }} className="!mt-0 min-w-0" triggerClassName="h-10 !min-h-10" options={[{ value: "", label: "Tất cả kênh" }, { value: "InApp", label: "In-app" }, { value: "Email", label: "Email" }, { value: "Both", label: "Cả hai" }]} />
        <FormDropdown value={status} onChange={(value) => { setStatus(value); setPage(1); }} className="!mt-0 min-w-0" triggerClassName="h-10 !min-h-10" options={[{ value: "", label: "Tất cả trạng thái" }, { value: "Completed", label: "Hoàn tất" }, { value: "Partial", label: "Một phần" }, { value: "Failed", label: "Thất bại" }]} />
        <input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} className="h-10 min-w-0 rounded-md border border-slate-200 px-2 text-sm" aria-label="Từ ngày" />
        <input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1); }} className="h-10 min-w-0 rounded-md border border-slate-200 px-2 text-sm" aria-label="Đến ngày" />
      </form>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">Không có lịch sử phù hợp.</div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[20%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[22%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-3 py-3">Thông báo</th><th className="px-3 py-3">Người gửi</th><th className="px-3 py-3">Kênh</th><th className="px-3 py-3">Kết quả</th><th className="px-3 py-3">Thời gian</th><th className="px-3 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-3 align-middle"><p className="truncate font-semibold text-slate-900">{item.title}</p><p className="truncate text-xs text-slate-500">{targetLabels[item.targetType] ?? item.targetType}</p></td>
                  <td className="px-3 py-3 align-middle"><p className="truncate font-medium" title={item.senderName}>{item.senderName}</p><p className="text-xs text-slate-400">ID {item.senderId}</p></td>
                  <td className="truncate px-3 py-3 align-middle">{item.channel}</td>
                  <td className="px-3 py-3 align-middle"><p className={item.status === "Completed" ? "font-semibold text-emerald-600" : item.status === "Failed" ? "font-semibold text-red-600" : "font-semibold text-amber-600"}>{statusLabels[item.status] ?? item.status}</p><p className="truncate text-xs text-slate-500">{item.successCount}/{item.totalTargeted} thành công</p></td>
                  <td className="whitespace-nowrap px-3 py-3 align-middle text-xs text-slate-500">{new Date(item.timestamp).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-2 py-3 text-right align-middle"><button type="button" onClick={() => setSelected(item)} className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50"><Eye className="h-3.5 w-3.5 shrink-0" /> Chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="grid h-9 w-9 place-items-center rounded-md border disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-slate-500">{page}/{totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="grid h-9 w-9 place-items-center rounded-md border disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold">{selected.title}</h3><p className="mt-1 text-xs text-slate-500">{new Date(selected.timestamp).toLocaleString("vi-VN")} · {selected.senderName}</p></div><button type="button" onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-500">Đóng</button></div>
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{selected.body}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center"><div className="rounded-lg bg-slate-50 p-3"><strong>{selected.totalTargeted}</strong><p className="text-xs text-slate-500">Tổng</p></div><div className="rounded-lg bg-emerald-50 p-3 text-emerald-700"><strong>{selected.successCount}</strong><p className="text-xs">Thành công</p></div><div className="rounded-lg bg-red-50 p-3 text-red-700"><strong>{selected.failedCount}</strong><p className="text-xs">Thất bại</p></div></div>
            {selected.errors.length > 0 ? <div className="mt-4"><h4 className="text-sm font-bold text-red-700">Chi tiết lỗi</h4><ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">{selected.errors.map((error, index) => <li key={`${index}-${error}`} className="py-1">{error}</li>)}</ul></div> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
