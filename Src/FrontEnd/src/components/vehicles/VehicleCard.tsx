import { Bike, Car, Heart, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import type { VehicleListItemResponse } from "@/features/vehicles/types";

type VehicleCardProps = {
  vehicle: VehicleListItemResponse;
  onOpen: () => void;
  onBook: () => void;
  bookLabel: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  favoriteLoading?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN");

function formatCurrency(price: number) {
  return Number.isFinite(price) && price > 0 ? `${currencyFormatter.format(price)}đ` : "Liên hệ";
}

function formatLocation(areaName: string | null) {
  if (!areaName?.trim()) return "Chưa cập nhật khu vực";
  const [province, ...localParts] = areaName.split(" - ").map((part) => part.trim()).filter(Boolean);
  return localParts.length > 0 ? `${localParts.join(", ")}, ${province}` : province;
}

function getVehicleTitle(vehicle: VehicleListItemResponse) {
  return [vehicle.brandName, vehicle.modelName, vehicle.year].filter(Boolean).join(" ");
}

function getStatusLabel(vehicle: VehicleListItemResponse) {
  const createdAt = new Date(vehicle.createdAt);
  const ageInDays = Number.isNaN(createdAt.getTime())
    ? Number.POSITIVE_INFINITY
    : (Date.now() - createdAt.getTime()) / 86_400_000;

  if (ageInDays >= 0 && ageInDays <= 30) return "Mới";
  if (vehicle.averageRating >= 4.5 && vehicle.reviewCount > 0) return "Nổi bật";
  return null;
}

export default function VehicleCard({
  vehicle,
  onOpen,
  onBook,
  bookLabel,
  isFavorite = false,
  onToggleFavorite,
  favoriteLoading = false,
}: VehicleCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = getVehicleTitle(vehicle);
  const statusLabel = getStatusLabel(vehicle);
  const hasRating = vehicle.averageRating > 0 && vehicle.reviewCount > 0;
  const VehicleIcon = vehicle.vehicleType === "Car" ? Car : Bike;

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-900/10 dark:border-white/10 dark:bg-surface-card dark:hover:border-brand-500/40 dark:hover:shadow-black/30">
      {onToggleFavorite ? (
        <button
          type="button"
          disabled={favoriteLoading}
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Bỏ yêu thích ${title}` : `Yêu thích ${title}`}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-500 shadow-md backdrop-blur transition hover:scale-105 hover:text-rose-500 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/80"
        >
          <Heart className={`h-4.5 w-4.5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-video w-full overflow-hidden bg-slate-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500 dark:bg-surface-hover"
        aria-label={`Xem chi tiết ${title}`}
      >
        {vehicle.featuredImage && !imageFailed ? (
          <img
            src={vehicle.featuredImage}
            alt={title}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.035]"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200/70 text-slate-400 dark:from-surface-hover dark:to-surface-elevated dark:text-gray-600">
            <VehicleIcon className="h-11 w-11" />
            <span className="text-xs">Chưa có hình ảnh</span>
          </span>
        )}

        {statusLabel ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-950/80 dark:text-white">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {statusLabel}
          </span>
        ) : null}
      </button>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="mb-2.5 min-h-7">
          {!vehicle.securityRequiresDeposit ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Miễn thế chấp
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="block w-full truncate text-left text-base font-extrabold text-slate-950 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-white dark:hover:text-brand-300"
          title={title}
        >
          {title}
        </button>

        <div className="mt-1.5 flex min-h-6 flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
          {vehicle.variantName ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 dark:bg-white/[0.06]">
              <VehicleIcon className="h-3.5 w-3.5" />
              {vehicle.variantName}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 dark:bg-white/[0.06]">
              <VehicleIcon className="h-3.5 w-3.5" />
              {vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy"}
            </span>
          )}
        </div>

        <p className="mt-2.5 flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400" title={formatLocation(vehicle.areaName)}>
          <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="truncate">{formatLocation(vehicle.areaName)}</span>
        </p>

        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-white/10">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 text-xs text-slate-500 dark:text-gray-400">
              {hasRating ? (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <strong className="font-semibold text-slate-800 dark:text-gray-100">
                    {vehicle.averageRating.toFixed(1)}
                  </strong>
                  <span>({vehicle.reviewCount} đánh giá)</span>
                </span>
              ) : (
                <span>Chưa có đánh giá</span>
              )}
            </div>

            <p className="shrink-0 text-right text-base font-bold leading-tight text-brand-600 dark:text-brand-300">
              {formatCurrency(vehicle.pricePerDay)}
              {vehicle.pricePerDay > 0 ? <span className="text-xs font-medium text-slate-500 dark:text-gray-400">/ngày</span> : null}
            </p>
          </div>

          <button
            type="button"
            onClick={onBook}
            className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 transition-all duration-200 hover:from-brand-700 hover:to-violet-700 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-[0.99]"
            aria-label={`${bookLabel} ${title}`}
          >
            {bookLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
