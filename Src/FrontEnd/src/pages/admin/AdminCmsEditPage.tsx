import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RichTextEditor from "@/components/editor/RichTextEditor";
import {
  getAdminCmsPageById,
  createAdminCmsPage,
  updateAdminCmsPage,
} from "@/features/admin/services/adminCmsService";
import { showToast } from "@/components/common/toastStore";
import { getApiErrorMessage } from "@/services/apiClient";

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

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export default function AdminCmsEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editId = id ? Number(id) : null;
  const isEdit = editId !== null && !isNaN(editId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  const [editorMode, setEditorMode] = useState<"sections" | "single">("sections");
  const [sections, setSections] = useState<Section[]>([]);
  const [singleContent, setSingleContent] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminCmsPageById(editId)
      .then((data) => {
        setFormTitle(data.title);
        setFormSlug(data.slug);
        setFormIsActive(data.isActive);
        if (isHtmlContent(data.content)) {
          setEditorMode("single");
          setSingleContent(data.content);
        } else {
          setEditorMode("sections");
          const parsed = parseContent(data.content);
          setSections(parsed.length ? parsed : [{ id: generateId("section"), title: "", content: [""] }]);
        }
      })
      .catch(() => showToast({ type: "error", title: "Lỗi", message: "Không thể tải thông tin trang CMS." }))
      .finally(() => setLoading(false));
  }, [editId, isEdit]);

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
    if (!formTitle.trim()) { setFormError("Vui lòng nhập tiêu đề."); titleRef.current?.focus(); return; }

    if (editorMode === "single") {
      if (!singleContent.trim()) { setFormError("Vui lòng nhập nội dung."); return; }
    } else {
      const validSections = sections.filter((s) => s.title.trim());
      if (!validSections.length) { setFormError("Vui lòng thêm ít nhất một section có tiêu đề."); return; }
    }

    setSaving(true); setFormError("");
    try {
      const contentValue = editorMode === "single" ? singleContent.trim() : sectionsToJson(sections.filter((s) => s.title.trim()));
      if (isEdit) {
        await updateAdminCmsPage(editId, { title: formTitle.trim(), content: contentValue, isActive: formIsActive });
        showToast({ type: "success", title: "Đã cập nhật", message: "Trang CMS đã được cập nhật." });
      } else {
        if (!formSlug.trim()) { setFormError("Vui lòng nhập slug."); setSaving(false); return; }
        await createAdminCmsPage({ slug: formSlug.trim(), title: formTitle.trim(), content: contentValue });
        showToast({ type: "success", title: "Đã tạo", message: "Trang CMS mới đã được tạo." });
      }
      navigate("/admin/cms-pages");
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Có lỗi xảy ra, vui lòng thử lại."));
    }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate("/admin/cms-pages")} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {isEdit ? "Sửa trang CMS" : "Tạo trang CMS"}
        </h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-4">
          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Tiêu đề</label>
              <input
                ref={titleRef}
                type="text"
                value={formTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormTitle(val);
                  if (!slugManuallyEdited && !isEdit) setFormSlug(toSlug(val));
                }}
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                placeholder="VD: Chính sách bảo mật"
              />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => { setSlugManuallyEdited(true); setFormSlug(e.target.value); }}
                onBlur={() => setFormSlug(toSlug(formSlug))}
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                placeholder="VD: privacy-policy"
              />
              <p className="mt-1 text-xs text-slate-400">Tự động sinh từ tiêu đề. Chỉ gồm chữ thường, số, dấu gạch ngang.</p>
            </div>
          )}

          {isEdit && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Kích hoạt</label>
              <button
                type="button"
                onClick={() => setFormIsActive((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formIsActive ? "bg-brand-600" : "bg-slate-300"}`}
              >
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
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(si, e.target.value)}
                        className="h-8 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                        placeholder="Tiêu đề section"
                      />
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
                            <button
                              type="button"
                              onClick={() => removeContentItem(si, ci)}
                              className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex"
                            >
                              ×
                            </button>
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
            <Button variant="ghost" onClick={() => navigate("/admin/cms-pages")}>Huỷ</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
