import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PromotionDetailModal from "@/components/home/PromotionDetailModal";

export interface PromotionSlide {
  id: string | number;
  image: string;
  title: string;
  /** Promotion liên kết (điều hướng CTA + nội dung động). Null = banner độc lập. */
  promotionId?: number | null;
  caption?: string;
  /** Mã voucher hiển thị trong popup (không hiện trên banner). */
  code?: string;
  ctaLabel?: string;
  popupTitle: string;
  popupDescription: string;
  popupCtaLabel: string;
  promotionName?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  vehicleType?: string | null;
  endAt?: string | null;
}

interface PromotionCarouselProps {
  slides: PromotionSlide[];
  /** Thời gian mỗi lượt autoplay (ms). Mặc định 5000. */
  intervalMs?: number;
}

/**
 * Showcase banner khuyến mãi kiểu campaign: 3 ảnh 16:9 trên desktop,
 * 2 trên tablet, 1 trên mobile. Click banner mở popup chi tiết.
 */
export default function PromotionCarousel({ slides, intervalMs = 5000 }: PromotionCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [paused, setPaused] = useState(false);
  const [popupSlide, setPopupSlide] = useState<PromotionSlide | null>(null);
  const count = slides.length;

  function updateNav() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPageCount(pages);
    setPage(Math.min(pages - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    setPage(0);
    trackRef.current?.scrollTo({ left: 0 });
    updateNav();
    window.addEventListener("resize", updateNav);
    return () => window.removeEventListener("resize", updateNav);
  }, [count]);

  // Autoplay: trượt 1 banner mỗi lượt, dừng khi hover/focus hoặc mở popup.
  useEffect(() => {
    if (paused || popupSlide !== null || count === 0) return;
    const timer = window.setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>(":scope > article");
      const step = (card?.clientWidth ?? el.clientWidth) + 20;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [paused, popupSlide, count, intervalMs]);

  function scrollByCard(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(":scope > article");
    const step = (card?.clientWidth ?? el.clientWidth) + 20;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  if (count === 0) return null;

  const showNav = canPrev || canNext || pageCount > 1;

  return (
    <div
      className="group/carousel relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          onScroll={updateNav}
          role="region"
          aria-roledescription="carousel"
          aria-label="Chương trình khuyến mãi"
          className={`hide-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth ${
            count < 3 ? "justify-center" : ""
          }`}
        >
          {slides.map((slide) => (
            <article
              key={slide.id}
              onClick={() => setPopupSlide(slide)}
              className="group relative aspect-[16/9] w-full shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-shadow hover:shadow-lg sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-14px)] dark:bg-neutral-800"
              style={{ scrollSnapAlign: "start" }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 pt-10">
                <p className="truncate text-sm font-bold text-white">{slide.title}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {showNav && (
        <>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            aria-label="Banner trước"
            className="absolute -left-3 top-[calc(50%-14px)] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-purple-700 shadow-md transition-all hover:scale-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 md:inline-flex dark:bg-neutral-800 dark:text-purple-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            aria-label="Banner tiếp theo"
            className="absolute -right-3 top-[calc(50%-14px)] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-purple-700 shadow-md transition-all hover:scale-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 md:inline-flex dark:bg-neutral-800 dark:text-purple-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Vị trí banner">
            {Array.from({ length: pageCount }).map((_, i) => (
              <span
                key={i}
                role="tab"
                aria-selected={i === page}
                className={`h-2 rounded-full transition-all ${
                  i === page ? "w-6 bg-purple-600" : "w-2 bg-slate-300 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>
        </>
      )}

      <PromotionDetailModal slide={popupSlide} onClose={() => setPopupSlide(null)} />
    </div>
  );
}
