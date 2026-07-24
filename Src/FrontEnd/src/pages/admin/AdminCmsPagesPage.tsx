import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RichTextEditor from "@/components/editor/RichTextEditor";
import {
  getAdminCmsPages,
  getAdminCmsPageById,
  createAdminCmsPage,
  updateAdminCmsPage,
  deleteAdminCmsPage,
  type CmsPageListItem,
} from "@/features/admin/services/adminCmsService";
import { showToast } from "@/components/common/toastStore";

const PAGE_SIZE = 10;

type Section = { id: string; title: string; content: string[] };

let sectionCounter = 0;
function generateId(title: string) {
  const base = title
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `section-${++sectionCounter}`;
}

function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith("<") || !trimmed.startsWith("[");
}

function parseContent(content: string): Section[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      const ids = new Set<string>();
      return parsed.map((s: any) => {
        const title = s.title ?? s.Title ?? "";
        let id = s.id ?? s.Id ?? "";
        if (!id || ids.has(id)) id = generateId(title);
        ids.add(id);
        return { id, title, content: s.content ?? s.Content ?? [] };
      });
    }
  } catch { /* not JSON */ }
  return [];
}

function sectionsToJson(sections: Section[]): string {
  return JSON.stringify(
    sections.map((s) => ({
      id: s.id || generateId(s.title),
      title: s.title,
      content: s.content,
    })),
  );
}

export default function AdminCmsPagesPage() {
  const [items, setItems] = useState<CmsPageListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const [editorMode, setEditorMode] = useState<"sections" | "single">("sections");
  const [sections, setSections] = useState<Section[]>([]);
  const [singleContent, setSingleContent] = useState("");

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

  function resetForm() {
    setFormTitle(""); setFormSlug(""); setFormIsActive(true);
    setSections([{ id: generateId("section"), title: "", content: [""] }]);
    setSingleContent("");
    setFormError("");
  }

  function openCreate() {
    setEditId(null);
    setEditorMode("sections");
    resetForm();
    setModalOpen(true);
  }

  async function openEdit(item: CmsPageListItem) {
    setEditId(item.id);
    setFormTitle(item.title); setFormSlug(item.slug); setFormIsActive(item.isActive);

    if (isHtmlContent(item.content)) {
      setEditorMode("single");
      setSingleContent(item.content);
    } else {
      setEditorMode("sections");
      const parsed = parseContent(item.content);
      setSections(parsed.length ? parsed : [{ id: generateId("section"), title: "", content: [""] }]);
    }

    setFormError(""); setModalOpen(true);
  }

  function addSection() {
    setSections((prev) => [...prev, { id: generateId("section"), title: "", content: [""] }]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSectionTitle(index: number, title: string) {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, title, id: generateId(title) } : s));
  }

  function addContentItem(sectionIndex: number) {
    setSections((prev) => prev.map((s, i) => i === sectionIndex ? { ...s, content: [...s.content, ""] } : s));
  }

  function updateContentItem(sectionIndex: number, contentIndex: number, html: string) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, content: s.content.map((c, j) => (j === contentIndex ? html : c)) }
          : s,
      ),
    );
  }

  function removeContentItem(sectionIndex: number, contentIndex: number) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex ? { ...s, content: s.content.filter((_, j) => j !== contentIndex) } : s,
      ),
    );
  }

  async function handleSave() {
    if (!formTitle.trim()) { setFormError("Vui lòng nhập tiêu đề."); return; }

    if (editorMode === "single") {
      if (!singleContent.trim()) { setFormError("Vui lòng nhập nội dung."); return; }
    } else {
      const validSections = sections.filter((s) => s.title.trim());
      if (!validSections.length) { setFormError("Vui lòng thêm ít nhất một section có tiêu đề."); return; }
    }

    setSaving(true); setFormError("");
    try {
      const contentValue = editorMode === "single" ? singleContent.trim() : sectionsToJson(sections.filter((s) => s.title.trim()));
      if (editId) {
        await updateAdminCmsPage(editId, { title: formTitle.trim(), content: contentValue, isActive: formIsActive });
        showToast({ type: "success", title: "Đã cập nhật", message: "Trang CMS đã được cập nhật." });
      } else {
        if (!formSlug.trim()) { setFormError("Vui lòng nhập slug."); setSaving(false); return; }
        await createAdminCmsPage({ slug: formSlug.trim(), title: formTitle.trim(), content: contentValue });
        showToast({ type: "success", title: "Đã tạo", message: "Trang CMS mới đã được tạo." });
      }
      setModalOpen(false); void load(page, keyword);
    } catch {
      setFormError("Có lỗi xảy ra, vui lòng thử lại.");
    }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAdminCmsPage(id);
      showToast({ type: "success", title: "Đã xoá", message: "Trang CMS đã được xoá." });
      setConfirmDelete(null); void load(page, keyword);
      } catch { showToast({ type: "error", title: "Xoá thất bại", message: "Vui lòng thử lại." }); }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Trang CMS</h1>
        <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />Tạo trang</Button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm kiếm..."
            className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <Button variant="ghost" onClick={handleSearch}>Tìm</Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tiêu đề</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Kích hoạt</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                    <td className="px-4 py-3 text-slate-500">{item.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${item.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {item.isActive ? "Có" : "Không"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(item.updatedAt).toLocaleDateString("vi-VN")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button type="button" onClick={() => openEdit(item)} className="rounded p-1.5 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600" title="Sửa">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(item.id)} className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Xoá">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">Không có trang CMS nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">Trước</button>
              <span className="text-sm text-slate-500">Trang {page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">Sau</button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Sửa trang CMS" : "Tạo trang CMS"}>
        <div className="space-y-4">
          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Tiêu đề</label>
            <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" placeholder="VD: Chính sách bảo mật" />
          </div>

          {!editId && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Slug</label>
              <input type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" placeholder="VD: privacy-policy" />
            </div>
          )}

          {editId && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Kích hoạt</label>
              <button type="button" onClick={() => setFormIsActive((v) => !v)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formIsActive ? "bg-brand-600" : "bg-slate-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formIsActive ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Chế độ soạn thảo</label>
            <div className="flex rounded-lg border border-slate-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setEditorMode("sections")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${editorMode === "sections" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                Sections
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("single")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${editorMode === "single" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                Single Editor
              </button>
            </div>
          </div>

          {editorMode === "sections" ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sections</label>
                <button type="button" onClick={addSection} className="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Thêm section</button>
              </div>
              <div className="space-y-4">
                {sections.map((section, si) => (
                  <div key={si} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <input type="text" value={section.title} onChange={(e) => updateSectionTitle(si, e.target.value)} className="h-8 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" placeholder="Tiêu đề section" />
                      <button type="button" onClick={() => removeSection(si)} className="text-xs text-red-500 hover:text-red-700">Xoá</button>
                    </div>
                    <div className="space-y-3">
                      {section.content.map((text, ci) => (
                        <div key={ci} className="group relative">
                          <RichTextEditor
                            content={text}
                            onChange={(html) => updateContentItem(si, ci, html)}
                            placeholder="Nhập nội dung..."
                          />
                          {section.content.length > 1 && (
                            <button type="button" onClick={() => removeContentItem(si, ci)} className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex">×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addContentItem(si)} className="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Thêm đoạn</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Nội dung (soạn H2, H3 để tự động sinh mục lục)</label>
              <RichTextEditor
                content={singleContent}
                onChange={setSingleContent}
                placeholder="Soạn nội dung trang..."
                showHeadings
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </div>
      </Modal>

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
