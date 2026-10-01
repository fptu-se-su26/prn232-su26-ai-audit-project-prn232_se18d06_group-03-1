import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Car, Check, TicketPercent, X } from "lucide-react";
import { cn } from "@/utils/cn";
import type { PromotionSlide } from "@/components/home/PromotionCarousel";

/** Điểm đến duy nhất của mọi CTA popup banner (popup-only, không cấu hình URL). */
const VOUCHER_HUNT_URL = "/customer/voucher-hunt";

/** Slide cho modal: giống PromotionSlide nhưng không bắt buộc ảnh (promotion không có ảnh). */
export type PromotionDetailSlide = Omit<PromotionSlide, "image"> & { image?: string | null };

function formatDiscount(slide: PromotionDetailSlide) {
  if (slide.discountValue == null) return null;
  if (slide.discountType === "Fixed") return `${Number(slide.discountValue).toLocaleString("vi-VN")}đ`;
  return `${slide.discountValue}%`;
}

function formatVehicleType(vehicleType?: string | null) {
  if (vehicleType === "Motorbike") return "Xe máy";
  if (vehicleType === "Car") return "Ô tô";
  if (vehicleType === "All") return "Tất cả xe";
  return null;
}

function formatEndDate(endAt?: string | null) {
  if (!endAt) return null;
  const d = new Date(endAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface PromotionDetailModalProps {
  slide: PromotionDetailSlide | null;
  onClose: () => void;
}

export default function PromotionDetailModal({ slide, onClose }: PromotionDetailModalProps) {
  const navigate = useNavigate();
  const [claimed, setClaimed] = useState(false);
  const timer = useRef<number | null>(null);
  const discount = slide ? formatDiscount(slide) : null;
  const vehicleLabel = formatVehicleType(slide?.vehicleType);
  const endLabel = formatEndDate(slide?.endAt);
  const code = slide?.code || null;

  // Banner gắn Promotion: Promotion là source of truth cho tiêu đề.
  const effectiveTitle = slide?.promotionName || slide?.popupTitle || slide?.title || "Chi tiết khuyến mãi";
  // CTA chỉ hiện khi có promotion hợp lệ (tránh orphan PromotionId).
  const hasPromotion = slide?.promotionId != null && (slide.code != null || slide.promotionName != null);
  const ctaTo = hasPromotion ? `${VOUCHER_HUNT_URL}?promotionId=${slide!.promotionId}` : VOUCHER_HUNT_URL;

  useEffect(() => {
    setClaimed(false);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [slide?.id]);

  useEffect(() => {
    if (!slide) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [slide, onClose]);

  function handleCtaClick(e: React.MouseEvent) {
    // Micro-interaction kiểu "nhận vé": hiện feedback rồi mới điều hướng.
    e.preventDefault();
    if (claimed || !slide) return;
    setClaimed(true);
    timer.current = window.setTimeout(() => {
      navigate(ctaTo);
    }, 380);
  }

  if (!slide || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={effectiveTitle}
    >
      <div
        className="relative my-auto flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-w-2xl dark:bg-surface-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white dark:bg-neutral-900/80 dark:text-neutral-200"
        >
          <X className="h-5 w-5" />
        </button>

        {slide.image && (
          <img
            src={slide.image}
            alt={slide.title}
            className="aspect-[16/9] w-full shrink-0 object-cover"
          />
        )}

        <div className="min-h-0 overflow-y-auto overscroll-contain p-6 sm:p-8">
          <h3 className="flex items-start gap-2 text-xl font-bold leading-snug text-slate-900 dark:text-text-primary">
            <span aria-hidden="true">✨</span>
            <span>{slide.popupTitle || slide.title}</span>
          </h3>

          {slide.popupDescription && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 md:text-base dark:text-gray-300">
              {slide.popupDescription}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {code && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 font-mono text-xs font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                <TicketPercent className="h-3.5 w-3.5" />
                {code}
              </span>
            )}
            {discount && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                Giảm {discount}
              </span>
            )}
            {vehicleLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                <Car className="h-3.5 w-3.5" />
                {vehicleLabel}
              </span>
            )}
            {endLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                <CalendarDays className="h-3.5 w-3.5" />
                HSD: {endLabel}
              </span>
            )}
          </div>

          {hasPromotion && (
            <div className="sticky bottom-0 -mx-1 mt-6 bg-gradient-to-t from-white via-white to-transparent pb-1 pt-4 dark:from-surface-modal dark:via-surface-modal">
              <button
                type="button"
                onClick={handleCtaClick}
                disabled={claimed}
                className={cn(
                  "group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-purple-200 active:scale-95",
                  claimed
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-600/20"
                    : "bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-500 shadow-purple-600/25 hover:brightness-110",
                )}
              >
                {claimed ? (
                  <>
                    Đang mở săn voucher...
                    <Check className="h-4 w-4 animate-pulse" />
                  </>
                ) : (
                  <>
                    {slide.popupCtaLabel || "Nhận voucher"}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
