import { useState } from "react";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import { parseSupportTicketAttachmentUrls } from "@/features/supportTickets/supportTicketAttachments";

type SupportTicketAttachmentGalleryProps = {
  attachmentUrls?: string | null;
  contrast?: "light" | "dark";
};

export default function SupportTicketAttachmentGallery({ attachmentUrls, contrast = "light" }: SupportTicketAttachmentGalleryProps) {
  const urls = parseSupportTicketAttachmentUrls(attachmentUrls);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  const images = urls.map((url, index) => ({ url, label: `Ảnh đính kèm ${index + 1}` }));
  const borderClass = contrast === "dark" ? "border-white/30" : "border-slate-200";

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.url}
            type="button"
            onClick={() => setPreviewIndex(index)}
            className={`overflow-hidden rounded-md border ${borderClass} bg-white/10`}
          >
            <img src={image.url} alt={image.label} className="aspect-square w-full object-cover transition duration-200 hover:scale-105" />
          </button>
        ))}
      </div>

      {previewIndex !== null && (
        <ImagePreviewModal
          images={images}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </>
  );
}
