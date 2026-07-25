import { ArrowLeft, FileText, Link2, Trash2, Upload } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

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

  async function handleImportFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx,.html,.htm,.txt,.pdf,.xlsx,.xls";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const ext = file.name.toLowerCase();
        let html: string;
        if (ext.endsWith(".docx")) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          html = result.value;
          if (!html.trim()) { setFormError("File Word không có nội dung."); return; }
        } else if (ext.endsWith(".pdf")) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const texts: string[] = [];
          for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            texts.push(content.items.map((item: any) => item.str).join(" "));
          }
          html = texts.filter(Boolean).map(t => `<p>${t}</p>`).join("");
          if (!html.trim()) { setFormError("File PDF không có nội dung."); return; }
        } else if (ext.endsWith(".xlsx") || ext.endsWith(".xls")) {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer);
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          html = XLSX.utils.sheet_to_html(sheet);
          if (!html.trim()) { setFormError("File Excel không có nội dung."); return; }
        } else if (ext.endsWith(".html") || ext.endsWith(".htm")) {
          html = await file.text();
        } else {
          const text = await file.text();
          html = text.split("\n").filter(Boolean).map(p => `<p>${p.trim()}</p>`).join("");
        }
        const text = html.replace(/<[^>]+>/g, "").trim();
        if (!text.length) { setFormError("File không có nội dung."); return; }
        const sectionTitle = file.name.replace(/\.[^.]+$/, "").trim() || "Nội dung import";
        const newSection: Section = { id: generateId(sectionTitle), title: sectionTitle, content: [html] };
        setSections(prev => [...prev, newSection]);
        setEditorMode("sections");
        showToast({ type: "success", title: "Đã import", message: `File "${file.name}" đã được thêm làm mục "${sectionTitle}".` });
      } catch (err: any) {
        setFormError(err.message || "Lỗi đọc file.");
      }
    };
    input.click();
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
      <div className="mb-8 flex items-start gap-3">
        <button type="button" onClick={() => navigate("/admin/cms-pages")} className="mt-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {isEdit ? "Sửa trang nội dung" : "Tạo trang nội dung"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">Quản lý nội dung hiển thị trên website</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-4">
          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <FileText className="h-4 w-4 text-slate-400" /> Tiêu đề
            </label>
            <input
              ref={titleRef}
              type="text"
              value={formTitle}
              onChange={(e) => {
                const val = e.target.value;
                setFormTitle(val);
                if (!slugManuallyEdited && !isEdit) setFormSlug(toSlug(val));
              }}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              placeholder="VD: Chính sách bảo mật"
            />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Link2 className="h-4 w-4 text-slate-400" /> Đường dẫn
              </label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => { setSlugManuallyEdited(true); setFormSlug(e.target.value); }}
                onBlur={() => setFormSlug(toSlug(formSlug))}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                placeholder="VD: chinh-sach-bao-mat"
              />
            </div>
          )}

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
              <button
                type="button"
                onClick={() => setFormIsActive((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formIsActive ? "bg-brand-600" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formIsActive ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <label className="text-sm font-semibold text-slate-700">Chế độ</label>
            <div className="flex rounded-lg border border-slate-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setEditorMode("sections")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${editorMode === "sections" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                Theo mục
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("single")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${editorMode === "single" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                Soạn thảo đơn
              </button>
            </div>
          </div>

          {editorMode === "sections" ? (
            <div>
              <label className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" /> Nội dung
              </label>
              <div className="space-y-5">
                {sections.map((section, si) => (
                  <Fragment key={section.id}>
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">MỤC {si + 1}</span>
                      <button type="button" onClick={() => removeSection(si)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                        Xoá mục
                      </button>
                    </div>
                    <div className="mb-5 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Tiêu đề</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(si, e.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                        placeholder="Nhập tiêu đề mục"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-500">Nội dung</label>
                      </div>
                      <div className="space-y-4">
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
                      </div>
                    </div>
                    <div className="mt-4">
                      <button type="button" onClick={() => addContentItem(si)} className="flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Thêm đoạn
                      </button>
                    </div>
                  </div>
                  </Fragment>
                ))}
              </div>
              <div className="mt-5">
                <button type="button" onClick={addSection} className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Thêm mục
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" /> Nội dung
              </label>
              <RichTextEditor
                content={singleContent}
                onChange={setSingleContent}
                placeholder="Soạn nội dung trang..."
                showHeadings
              />
            </div>
          )}

          <hr className="border-slate-200" />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button variant="ghost" onClick={handleImportFile}><Upload className="mr-1.5 h-4 w-4" /> Import file</Button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/admin/cms-pages")}>Huỷ</Button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
