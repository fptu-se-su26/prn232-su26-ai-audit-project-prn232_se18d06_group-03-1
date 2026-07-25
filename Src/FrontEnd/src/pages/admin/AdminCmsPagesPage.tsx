import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  getAdminCmsPages,
  deleteAdminCmsPage,
  updateAdminCmsPage,
  type CmsPageListItem,
} from "@/features/admin/services/adminCmsService";
import { showToast } from "@/components/common/toastStore";

const PAGE_SIZE = 10;

export default function AdminCmsPagesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CmsPageListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async (p: number, kw: string) => {
    setIsLoading(true); setError(null);
    try {
      const result = await getAdminCmsPages(kw || undefined, p, PAGE_SIZE);
      setItems(result.items); setTotalCount(result.totalCount); setPage(result.page); setTotalPages(result.totalPages);
    } catch { setError("Không thể tải danh sách CMS."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void load(1, ""); }, [load]);

  function handleSearch() { setPage(1); void load(1, keyword); }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p); void load(p, keyword);
  }

  function handleToggleActive(item: CmsPageListItem) {
    const newActive = !item.isActive;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isActive: newActive } : i));
    updateAdminCmsPage(item.id, { title: item.title, content: item.content, isActive: newActive })
      .then(() => showToast({ type: "success", title: newActive ? "Đã kích hoạt" : "Đã tắt", message: `Trang "${item.title}" ${newActive ? "đã được kích hoạt." : "đã tắt."}` }))
      .catch(() => {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isActive: !newActive } : i));
        showToast({ type: "error", title: "Thất bại", message: "Không thể thay đổi trạng thái." });
      });
  }

  async function handleDelete(id: number) {
    try {
      await deleteAdminCmsPage(id);
      showToast({ type: "success", title: "Đã xoá", message: "Trang CMS đã được xoá." });
      setConfirmDelete(null);
      const result = await getAdminCmsPages(keyword || undefined, page, PAGE_SIZE);
      if (page > result.totalPages && result.totalPages > 0) {
        setPage(result.totalPages);
        void load(result.totalPages, keyword);
      } else {
        setItems(result.items); setTotalCount(result.totalCount); setPage(result.page); setTotalPages(result.totalPages);
      }
      } catch { showToast({ type: "error", title: "Xoá thất bại", message: "Vui lòng thử lại." }); }
  }

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Trang CMS</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý danh sách trang nội dung.</p>
        </div>
        <Button onClick={() => navigate("/admin/cms-pages/create")}><Plus className="h-4 w-4" /> Tạo trang</Button>
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm tiêu đề hoặc slug..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button type="button" onClick={handleSearch} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800">
            <Search className="h-4 w-4" /> Tìm
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-medium text-slate-700">{totalCount} trang</div>
          {isLoading && <LoadingSpinner className="h-4 w-4" />}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Kích hoạt</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                  <td className="px-4 py-3 text-slate-500">{item.slug}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => handleToggleActive(item)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 ${item.isActive ? "bg-brand-600" : "bg-slate-300"}`} role="switch" aria-checked={item.isActive}>
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${item.isActive ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(item.updatedAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => navigate(`/admin/cms-pages/${item.id}/edit`)} title="Sửa" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(item.id)} title="Xoá" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">Không có trang CMS nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-sm text-slate-500">Trang {page} / {totalPages}</div>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              {pageNumbers.map((p, i) => p === "..." ? <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">...</span> : (
                <button key={p} type="button" onClick={() => goToPage(p as number)} className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${p === page ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{p}</button>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Xác nhận xoá">
        <p className="text-sm text-slate-600">Bạn có chắc muốn xoá trang CMS này?</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Huỷ</Button>
          <Button onClick={() => confirmDelete !== null && handleDelete(confirmDelete)} variant="danger">Xoá</Button>
        </div>
      </Modal>
    </div>
  );
}
