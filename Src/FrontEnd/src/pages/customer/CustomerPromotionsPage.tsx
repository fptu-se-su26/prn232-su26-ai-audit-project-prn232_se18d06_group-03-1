import { CalendarDays, Car, ChevronLeft, ChevronRight, Search, Sparkles, TicketPercent } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@/components/common/Alert";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PromotionDetailModal, { type PromotionDetailSlide } from "@/components/home/PromotionDetailModal";
import { getHomepageBanners } from "@/features/banners/services/bannerService";
import type { HomepageBanner } from "@/features/banners/types";
import { getActivePromotions } from "@/features/promotions/services/promotionService";
import type { Promotion } from "@/features/promotions/types";

type VehicleFilter = "All" | "Car" | "Motorbike";

const VEHICLE_FILTERS: { value: VehicleFilter; label: string }[] = [
  { value: "All", label: "Tất cả" },
  { value: "Car", label: "Ô tô" },
  { value: "Motorbike", label: "Xe máy" },
];

function formatVehicleType(vehicleType: string) {
  if (vehicleType === "Motorbike") return "Xe máy";
  if (vehicleType === "Car") return "Ô tô";
  return "Tất cả phương tiện";
}

function formatEndDate(endAt?: string) {
  if (!endAt) return null;
  const d = new Date(endAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toDetailSlide(p: Promotion): PromotionDetailSlide {
  return {
    id: p.id,
    promotionId: p.id,
    title: p.name,
    caption: p.description,
    code: p.code,
    popupTitle: p.name,
    popupDescription: p.description ?? null,
    popupCtaLabel: "Săn voucher ngay",
    promotionName: p.name,
    discountType: p.discountType,
    discountValue: p.discountValue,
    vehicleType: p.vehicleType,
    endAt: p.endAt,
  };
}

/** Banner hero dùng ảnh campaign thật từ Banner API (không tự vẽ artwork). */
function HeroCarousel({ slides, onOpen }: { slides: PromotionDetailSlide[]; onOpen: (s: PromotionDetailSlide) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function updateNav() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const count = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPageCount(count);
    setPage(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateNav();
    window.addEventListener("resize", updateNav);
    return () => window.removeEventListener("resize", updateNav);
  }, [slides.length]);

  function scrollByCard(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(":scope > article");
    const step = (card?.clientWidth ?? el.clientWidth) + 20;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  const showNav = slides.length > 0 && (canPrev || canNext || pageCount > 1);

  return (
    <div className="group/hero relative">
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          onScroll={updateNav}
          className={`hide-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth ${
            slides.length < 3 ? "justify-center" : ""
          }`}
        >
          {slides.map((s) => (
            <article
              key={s.id}
              onClick={() => onOpen(s)}
              className="group relative aspect-[16/9] w-full shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-shadow hover:shadow-lg sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-14px)] dark:bg-neutral-800"
              style={{ scrollSnapAlign: "start" }}
            >
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600" />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 pt-10">
                <p className="truncate text-sm font-bold text-white">{s.title}</p>
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
            className="absolute -left-3 top-[calc(50%-14px)] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-purple-700 shadow-md transition-all hover:scale-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 md:inline-flex dark:bg-neutral-800 dark:text-purple-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            aria-label="Banner tiếp theo"
            className="absolute -right-3 top-[calc(50%-14px)] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-purple-700 shadow-md transition-all hover:scale-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 md:inline-flex dark:bg-neutral-800 dark:text-purple-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: pageCount }).map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${i === page ? "w-6 bg-purple-600" : "w-2 bg-slate-300 dark:bg-neutral-700"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function isExpiringSoon(endAt?: string) {
  if (!endAt) return false;
  const diff = new Date(endAt).getTime() - Date.now();
  return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

function PromotionCard({ item, onOpen }: { item: Promotion; onOpen: (p: Promotion) => void }) {
  const endLabel = formatEndDate(item.endAt);
  const expiringSoon = isExpiringSoon(item.endAt);

  return (
    <article
      onClick={() => onOpen(item)}
      className="group relative flex cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-600/10 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative flex w-28 shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-2 py-5 text-white sm:w-32">
        <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Giảm</span>
        <span className="text-3xl font-black tracking-tight drop-shadow-sm sm:text-4xl">
          {item.discountType === "Fixed" ? <>{(Number(item.discountValue) / 1000).toFixed(0)}k</> : <>{item.discountValue}%</>}
        </span>
        <TicketPercent className="mt-1 h-4 w-4 text-white/60" />
      </div>

      <div aria-hidden="true" className="relative flex w-0 flex-col items-stretch justify-between py-2">
        <span className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-b border-slate-100 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950" />
        <span className="mx-auto w-px flex-1 border-l-2 border-dashed border-slate-200 dark:border-neutral-700" />
        <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-t border-slate-100 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-2 py-4 pl-3 pr-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            🔴 Đang diễn ra
          </span>
          {expiringSoon && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
              ⏰ Sắp hết hạn
            </span>
          )}
        </div>
        <div>
          <h3 className="truncate font-bold text-slate-800 transition-colors group-hover:text-purple-700 dark:text-white">
            {item.name}
          </h3>
          {item.description && <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-slate-500">{item.description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-neutral-300">
          <span className="inline-flex items-center gap-1 font-medium">
            <Car className="h-3.5 w-3.5 text-slate-400" />
            {formatVehicleType(item.vehicleType)}
          </span>
          {endLabel && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              HSD: {endLabel}
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-purple-600 transition-transform group-hover:translate-x-1 hover:text-purple-700 dark:text-purple-300">
          Xem ưu đãi →
        </span>
      </div>
    </article>
  );
}

export default function CustomerPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>("All");
  const [selected, setSelected] = useState<PromotionDetailSlide | null>(null);
  const [banners, setBanners] = useState<HomepageBanner[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getActivePromotions().catch(() => [] as Promotion[]),
      getHomepageBanners().catch(() => [] as HomepageBanner[]),
    ])
      .then(([promos, bannerList]) => {
        if (cancelled) return;
        setItems(Array.isArray(promos) ? promos : []);
        setBanners(Array.isArray(bannerList) ? bannerList : []);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (vehicleFilter !== "All" && p.vehicleType !== "All" && p.vehicleType !== vehicleFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, vehicleFilter]);

  // Hero showcase từ Banner API (ảnh campaign thật), join promotion có sẵn để mở modal.
  const heroSlides = useMemo<PromotionDetailSlide[]>(() => {
    const byId = new Map(items.map((p) => [p.id, p]));
    return banners.map((b) => {
      const promo = b.promotionId != null ? byId.get(b.promotionId) : undefined;
      return {
        id: `banner-${b.id}`,
        image: b.imageUrl,
        title: b.title,
        code: b.promotionCode ?? promo?.code ?? undefined,
        popupTitle: b.popupTitle,
        popupDescription: b.popupDescription,
        popupCtaLabel: b.popupCtaLabel,
        promotionName: b.promotionName ?? promo?.name ?? null,
        discountType: b.discountType ?? promo?.discountType ?? null,
        discountValue: b.discountValue ?? promo?.discountValue ?? null,
        vehicleType: b.vehicleType ?? promo?.vehicleType ?? null,
        endAt: b.endAt ?? promo?.endAt ?? null,
      };
    });
  }, [banners, items]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Promotions"
        title="Khuyến mãi"
        description={`Khám phá các ưu đãi mới nhất từ MoveVN.${
          !loading && !error && items.length > 0 ? ` Hiện có ${items.length} chương trình đang diễn ra.` : ""
        }`}
        actions={
          <Link
            to="/customer/voucher-hunt"
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 transition-colors hover:bg-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:hover:bg-purple-500/25"
          >
            <Sparkles className="h-4 w-4" />
            Săn mã
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, mã hoặc mô tả khuyến mãi..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-neutral-800">
          {VEHICLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setVehicleFilter(f.value)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                vehicleFilter === f.value
                  ? "bg-white text-brand-700 shadow-sm dark:bg-neutral-900 dark:text-brand-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-neutral-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      )}

      {!loading && error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && items.length === 0 && (
        <Alert variant="info" title="Chưa có ưu đãi">
          Hiện tại chưa có chương trình khuyến mãi nào đang diễn ra. Bạn có thể quay lại sau hoặc{" "}
          <Link to="/customer/voucher-hunt" className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700">
            săn voucher ngay
          </Link>
          .
        </Alert>
      )}

      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <p className="font-semibold text-slate-700 dark:text-neutral-200">Không tìm thấy ưu đãi phù hợp</p>
          <p className="mt-1 text-sm text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc.</p>
        </div>
      )}

      {!loading && !error && heroSlides.length > 0 && (
        <HeroCarousel slides={heroSlides} onOpen={setSelected} />
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Các ưu đãi đang diễn ra</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((p) => (
              <PromotionCard key={p.id} item={p} onOpen={(item) => setSelected(toDetailSlide(item))} />
            ))}
          </div>
        </>
      )}

      <PromotionDetailModal
        slide={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
