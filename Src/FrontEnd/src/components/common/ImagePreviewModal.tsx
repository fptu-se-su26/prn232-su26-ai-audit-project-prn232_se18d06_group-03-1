import { ChevronLeft, ChevronRight, X, FileQuestion } from "lucide-react";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export type ImagePreviewItem = {
  url: string;
  label?: string;
};

type ImagePreviewModalProps = {
  images?: ImagePreviewItem[];
  index?: number;
  onIndexChange?: (index: number) => void;
  onClose: () => void;
  isOpen?: boolean;
  src?: string | null;
  title?: string;
};

export default function ImagePreviewModal({
  images = [],
  index = 0,
  onIndexChange,
  onClose,
  isOpen = true,
  src,
  title,
}: ImagePreviewModalProps) {
  const [imgError, setImgError] = useState(false);

  if (!isOpen) return null;

  const modalImages = src ? [{ url: src, label: title }] : images;
  const safeImages = Array.isArray(modalImages) ? modalImages.filter((image) => image?.url) : [];
  const safeIndex = Number.isInteger(index) && index >= 0 && index < safeImages.length ? index : 0;
  const image = safeImages[safeIndex];
  if (!image) return null;

  const canNavigate = safeImages.length > 1 && !!onIndexChange;
  const previous = () => { setImgError(false); onIndexChange?.((safeIndex - 1 + safeImages.length) % safeImages.length); };
  const next = () => { setImgError(false); onIndexChange?.((safeIndex + 1) % safeImages.length); };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex h-dvh w-screen items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <div className="relative flex max-h-full w-full max-w-5xl flex-col items-center" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-0 top-0 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white">
          <X className="h-5 w-5" />
        </button>
        {canNavigate && (
          <button type="button" onClick={previous} className="absolute left-0 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {imgError ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-slate-800 p-12 shadow-2xl">
            <FileQuestion className="mb-3 h-16 w-16 text-slate-500" />
            <p className="text-sm text-slate-400">Không thể tải hình ảnh</p>
          </div>
        ) : (
          <img src={image.url} alt={image.label ?? ""} onError={() => setImgError(true)} className="max-h-[82dvh] max-w-full rounded-lg object-contain shadow-2xl" />
        )}
        {canNavigate && (
          <button type="button" onClick={next} className="absolute right-0 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
        <div className="mt-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {image.label ?? `Ảnh ${safeIndex + 1}`} {canNavigate ? `(${safeIndex + 1}/${safeImages.length})` : ""}
        </div>
      </div>
    </div>,
    document.body,
  );
}
