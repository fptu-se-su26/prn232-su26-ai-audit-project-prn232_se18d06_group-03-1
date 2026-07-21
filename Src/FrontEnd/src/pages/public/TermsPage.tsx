import { useEffect, useRef, useState } from "react";
import { FileText, ChevronRight } from "lucide-react";
import { getCmsPageBySlug } from "@/features/cms/services/cmsService";

type Section = { id: string; title: string; content: string[] };

export default function TermsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const tocItems = sections.map((s) => ({ id: s.id, label: s.title }));
  const [activeId, setActiveId] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    getCmsPageBySlug("terms-of-service").then((data) => {
      if (data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed) && parsed.length) {
            const mapped = parsed.map((item: any) => ({
              id: item.id ?? item.Id,
              title: item.title ?? item.Title,
              content: item.content ?? item.Content,
            }));
            setSections(mapped);
          }
        } catch { /* ignore */ }
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    for (const ref of Object.values(sectionRefs.current)) {
      if (ref) observer.observe(ref);
    }
    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-brand-600 dark:text-brand-400" />
          <div>
            <p className="text-sm sm:text-base font-black uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Điều khoản</p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Điều khoản{" "}
              <span className="italic lowercase text-brand-600 dark:text-brand-400">sử dụng</span> MoveVN
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Đang tải...</div>
        ) : sections.length === 0 ? (
          <div className="text-center py-20 text-slate-500">Không có nội dung.</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 shrink-0">
              <nav className="lg:sticky lg:top-24 space-y-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/70">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-500">Mục lục</h3>
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                      activeId === item.id
                        ? "bg-brand-100 text-brand-700 font-semibold dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${activeId === item.id ? "text-brand-600 dark:text-brand-400" : "text-transparent"}`} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0 space-y-6">
              {sections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  className="scroll-mt-28 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/70"
                >
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">{section.title}</h2>
                  <div className="mt-4 space-y-3">
                    {section.content.map((text, idx) => {
                      if (text.startsWith("–") || text.startsWith("•")) {
                        return <li key={idx} className="ml-5 text-sm leading-7 text-slate-600 dark:text-gray-400 list-disc">{text.substring(2)}</li>;
                      }
                      if (text.match(/^\d+\.\d+\./) || text.startsWith("4.") || text.startsWith("5.") || text.startsWith("6.") || text.startsWith("7.") || text.startsWith("8.") || text.startsWith("9.") || text.startsWith("10.") || text.startsWith("11.") || text.startsWith("12.") || text.startsWith("13.") || text.startsWith("14.")) {
                        return <p key={idx} className="text-sm font-semibold leading-7 text-slate-800 dark:text-gray-200">{text}</p>;
                      }
                      if (text === "") return <div key={idx} className="h-1" />;
                      return <p key={idx} className="text-sm leading-7 text-slate-600 dark:text-gray-400">{text}</p>;
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
