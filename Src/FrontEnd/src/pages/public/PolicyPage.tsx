import { useEffect, useRef, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getCmsPageNavigation, getCmsPageBySlug } from "@/features/cms/services/cmsService";
import type { CmsPageNavigationItem, CmsPageResponse } from "@/features/cms/types";

type Section = { id: string; title: string; content: string[] };
type TocItem = { id: string; text: string; level: number };

let sectionIdCounter = 0;
function generateSectionId(title: string) {
  const base = title
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `section-${++sectionIdCounter}`;
}

function isJsonContent(content: string): Section[] | null {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length) {
      const ids = new Set<string>();
      return parsed.map((item: any) => {
        const title = item.title ?? item.Title ?? "";
        let id = item.id ?? item.Id ?? "";
        if (!id || ids.has(id)) id = generateSectionId(title);
        ids.add(id);
        return { id, title, content: item.content ?? item.Content ?? [] };
      });
    }
  } catch { /* not JSON */ }
  return null;
}

function parseHtmlHeadings(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let idCounter = 0;

  const result = html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (_match, level, attrs, content) => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    const rawId = text
      .toLowerCase()
      .replace(/đ/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `heading-${idCounter}`;
    const id = toc.some((t) => t.id === rawId) ? `${rawId}-${idCounter}` : rawId;

    toc.push({ id, text, level: parseInt(level) });
    idCounter++;

    if (/\bid=/.test(attrs)) return _match;
    return `<h${level} id="${id}"${attrs}>${content}</h${level}>`;
  });

  return { html: result, toc };
}

function hasHeadings(html: string): boolean {
  return /<h[23][^>]*>/i.test(html);
}

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();

  const [navItems, setNavItems] = useState<CmsPageNavigationItem[]>([]);
  const [page, setPage] = useState<CmsPageResponse | null | undefined>(undefined);
  const [sections, setSections] = useState<Section[]>([]);
  const [htmlContent, setHtmlContent] = useState("");
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCmsPageNavigation().then(setNavItems);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setPage(undefined);
    setSections([]);
    setHtmlContent("");
    setTocItems([]);
    setActiveId("");
    getCmsPageBySlug(slug).then((data) => {
      setPage(data ?? null);
      if (data?.content) {
        const parsed = isJsonContent(data.content);
        if (parsed) {
          setSections(parsed);
        } else if (hasHeadings(data.content)) {
          const { html, toc } = parseHtmlHeadings(data.content);
          setHtmlContent(html);
          setTocItems(toc);
        } else {
          setHtmlContent(data.content);
        }
      }
    });
  }, [slug]);

  const hasToc = sections.length > 1 || tocItems.length > 1;
  const showSidebarToc = sections.length > 1;

  function handleTocClick(id: string) {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    if (!hasToc) return;
    const ids = sections.length ? sections.map((s) => s.id) : tocItems.map((t) => t.id);
    if (!ids.length) return;

    function update() {
      let current = ids[0];
      const nearBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY <= 100;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 300 || nearBottom) current = id;
      }
      setActiveId(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [hasToc, sections, tocItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white transition-colors duration-300">
      {/* Hero Banner */}
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-10">
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-[20px]"
          style={{ height: "400px", backgroundImage: "url(/images/123.png)", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <h1 className="relative text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-[56px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            Chính sách & Quy định
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-[50px] pb-16">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="lg:w-[260px] shrink-0">
            <nav className="lg:sticky lg:top-24 space-y-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/70">
              <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-500">
                Danh sách
              </h3>
              {navItems.length === 0 && (
                <p className="text-sm text-slate-400">Đang tải...</p>
              )}
              {navItems.map((item) => (
                <NavLink
                  key={item.slug}
                  to={`/policies/${item.slug}`}
                  className={({ isActive }) =>
                    `block w-full rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                    }`
                  }
                >
                  {item.title}
                </NavLink>
              ))}
              {hasToc && (
                <>
                  <hr className="my-2 border-slate-200 dark:border-neutral-800" />
                  <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-500">
                    Mục lục
                  </h3>
                  {showSidebarToc
                    ? sections.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleTocClick(s.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                            activeId === s.id
                              ? "bg-brand-100 text-brand-700 font-semibold dark:bg-brand-900/30 dark:text-brand-300"
                              : "text-slate-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <ChevronRight
                            className={`h-3 w-3 shrink-0 transition-transform ${
                              activeId === s.id ? "text-brand-600 dark:text-brand-400" : "text-transparent"
                            }`}
                          />
                          {s.title}
                        </button>
                      ))
                    : tocItems.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleTocClick(t.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                            activeId === t.id
                              ? "bg-brand-100 text-brand-700 font-semibold dark:bg-brand-900/30 dark:text-brand-300"
                              : "text-slate-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                          } ${t.level === 3 ? "pl-6" : ""}`}
                        >
                          <ChevronRight
                            className={`h-3 w-3 shrink-0 transition-transform ${
                              activeId === t.id ? "text-brand-600 dark:text-brand-400" : "text-transparent"
                            }`}
                          />
                          {t.text}
                        </button>
                      ))}
                </>
              )}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {page === undefined ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-1/2 rounded bg-slate-200 dark:bg-neutral-800" />
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-neutral-800" />
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-neutral-800" />
                <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-neutral-800" />
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-neutral-800" />
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-neutral-800" />
                <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-neutral-800" />
              </div>
            ) : page === null ? (
              <p className="py-20 text-center text-slate-500">Không tìm thấy nội dung.</p>
            ) : sections.length > 0 ? (
              <div className="space-y-6">
                {sections.map((section) => (
                  <article
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/70"
                  >
                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {section.title}
                    </h2>
                    <div className="mt-4 space-y-3">
                      {section.content.map((text, idx) => {
                        if (text.startsWith("<")) {
                          return <div key={idx} className="text-sm leading-7 text-slate-600 dark:text-gray-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1" dangerouslySetInnerHTML={{ __html: text }} />;
                        }
                        if (text.startsWith("–") || text.startsWith("•")) {
                          return (
                            <li key={idx} className="ml-5 list-disc text-sm leading-7 text-slate-600 dark:text-gray-400">
                              {text.substring(2)}
                            </li>
                          );
                        }
                        if (text === "") return <div key={idx} className="h-1" />;
                        return (
                          <p key={idx} className="text-sm leading-7 text-slate-600 dark:text-gray-400">
                            {text}
                          </p>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            ) : htmlContent ? (
              <article className="prose prose-slate max-w-none dark:prose-invert">
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{page.title}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cập nhật lần cuối: {new Date(page.updatedAt).toLocaleDateString("vi-VN")}
                </p>
                <hr className="my-6 border-slate-200 dark:border-neutral-800" />
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              </article>
            ) : (
              <article className="prose prose-slate max-w-none dark:prose-invert">
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{page.title}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cập nhật lần cuối: {new Date(page.updatedAt).toLocaleDateString("vi-VN")}
                </p>
                <hr className="my-6 border-slate-200 dark:border-neutral-800" />
                <div dangerouslySetInnerHTML={{ __html: page.content }} />
              </article>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
